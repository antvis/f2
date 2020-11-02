import * as Attr from '../attr/index';
import { isArray, isString, each, isFunction, upperFirst, mix, isNil, isObject, Array as ArrayUtil, toTimeStamp } from '../util/common';
import Base from '../base';
import Global from '../global';
import GeometryShape from './shape/shape';
import Adjust from '@antv/adjust/lib/base';
import { createShape } from '../graphic/index';
import { getAnimation } from '../graphic/anim/index';

const GROUP_ATTRS = [ 'color', 'size', 'shape' ];
const FIELD_ORIGIN = '_origin';
const FIELD_ORIGIN_Y = '_originY';

function parseFields(field) {
  if (isArray(field)) {
    return field;
  }
  if (isString(field)) {
    return field.split('*');
  }
  return [ field ];
}

/**
 * The parent class for Geometry
 * @class Geom
 */
class Geom extends Base {

  getDefaultCfg() {
    return {
      /**
       * geometry type
       * @type {String}
       */
      type: null,
      /**
       * the data of geometry
       * @type {Array}
       */
      data: null,
      /**
       * the attrs of geo,etry
       * @type {Object}
       */
      attrs: {},

      scales: {},

      /**
       * group for storing the shapes
       * @type {Canvas}
       */
      container: null,
      /**
       * style options
       * @type {Object}
       */
      styleOptions: null,

      chart: null,

      shapeType: '',

      /**
       * wether to generate key points for each shape
       * @protected
       * @type {Boolean}
       */
      generatePoints: false,

      attrOptions: {},

      sortable: false,
      startOnZero: true,
      visible: true,
      connectNulls: false,
      // 是否丢弃没有值的分组。
      ignoreEmptyGroup: false,
      // 是否已经初始化
      isInit: false
    };
  }

  init() {
    const self = this;
    const isInit = self.get('isInit');
    if (isInit) {
      return;
    }
    self._initAttrs();
    self._processData();
    self.set('isInit', true);
  }

  _getGroupScales() {
    const self = this;
    const scales = [];
    each(GROUP_ATTRS, function(attrName) {
      const attr = self.getAttr(attrName);
      if (attr) {
        const attrScales = attr.scales;
        each(attrScales, function(scale) {
          if (scale && scale.isCategory && scales.indexOf(scale) === -1) {
            scales.push(scale);
          }
        });
      }
    });
    return scales;
  }

  _groupData(data) {
    const self = this;
    const colDefs = self.get('colDefs');
    const groupScales = self._getGroupScales();
    if (groupScales.length) {
      const appendConditions = {};
      const names = [];
      each(groupScales, scale => {
        const field = scale.field;
        names.push(field);
        if (colDefs && colDefs[field] && colDefs[field].values) { // users have defined
          appendConditions[scale.field] = colDefs[field].values;
        }
      });
      return ArrayUtil.group(data, names, appendConditions);
    }
    return [ data ];

  }

  _setAttrOptions(attrName, attrCfg) {
    const options = this.get('attrOptions');
    options[attrName] = attrCfg;

    const attrs = this.get('attrs');
    // 说明已经初始化过了
    if (Object.keys(attrs).length) {
      this._createAttr(attrName, attrCfg);
    }
  }

  _createAttrOption(attrName, field, cfg, defaultValues) {
    const attrCfg = {};
    attrCfg.field = field;
    if (cfg) {
      if (isFunction(cfg)) {
        attrCfg.callback = cfg;
      } else {
        attrCfg.values = cfg;
      }
    } else {
      attrCfg.values = defaultValues;
    }
    this._setAttrOptions(attrName, attrCfg);
  }

  _createAttr(type, option) {
    const self = this;
    const attrs = self.get('attrs');
    const coord = self.get('coord');
    const className = upperFirst(type);
    const fields = parseFields(option.field);
    if (type === 'position') {
      option.coord = coord;
    }
    const scales = [];
    for (let i = 0, len = fields.length; i < len; i++) {
      const field = fields[i];
      const scale = self._createScale(field);
      scales.push(scale);
    }
    if (type === 'position') {
      const yScale = scales[1];

      // 饼图的处理，但是还不知道为啥
      if (coord.type === 'polar' && coord.transposed && self.hasAdjust('stack')) {
        if (yScale.values.length) {
          yScale.change({
            nice: false,
            min: 0,
            max: Math.max.apply(null, yScale.values)
          });
        }
      }
    }

    option.scales = scales;
    const attr = new Attr[className](option);
    attrs[type] = attr;
    return attr;
  }

  _initAttrs() {
    const self = this;
    const attrOptions = self.get('attrOptions');

    for (const type in attrOptions) {
      if (attrOptions.hasOwnProperty(type)) {
        this._createAttr(type, attrOptions[type]);
      }
    }
  }

  _createScale(field) {
    const scales = this.get('scales');
    let scale = scales[field];
    if (!scale) {
      scale = this.get('chart').createScale(field);
      scales[field] = scale;
    }
    return scale;
  }

  _processData() {
    const self = this;
    const data = this.get('data');
    const dataArray = [];
    let groupedArray = this._groupData(data);
    if (this.get('ignoreEmptyGroup')) {
      const yScale = this.getYScale();
      groupedArray = groupedArray.filter(group =>
        group.some(item => typeof item[yScale.field] !== 'undefined')
      );
    }
    for (let i = 0, len = groupedArray.length; i < len; i++) {
      const subData = groupedArray[i];
      const tempData = self._saveOrigin(subData);
      if (this.hasAdjust('dodge')) {
        self._numberic(tempData);
      }
      dataArray.push(tempData);
    }
    if (self.get('adjust')) {
      self._adjustData(dataArray);
    }
    if (self.get('sortable')) {
      self._sort(dataArray);
    }
    self.emit('afterprocessdata', { dataArray });
    self.set('mappingData', dataArray);
    self.set('dataArray', dataArray);
    return dataArray;
  }

  _saveOrigin(data) {
    const rst = [];
    for (let i = 0, len = data.length; i < len; i++) {
      const origin = data[i];
      const obj = {};
      for (const k in origin) {
        obj[k] = origin[k];
      }
      obj[FIELD_ORIGIN] = origin;
      rst.push(obj);
    }
    return rst;
  }

  _numberic(data) {
    const positionAttr = this.getAttr('position');
    const scales = positionAttr.scales;
    for (let j = 0, len = data.length; j < len; j++) {
      const obj = data[j];
      const count = Math.min(2, scales.length);
      for (let i = 0; i < count; i++) {
        const scale = scales[i];
        if (scale.isCategory) {
          const field = scale.field;
          obj[field] = scale.translate(obj[field]);
        }
      }
    }
  }

  _adjustData(dataArray) {
    const self = this;
    const adjust = self.get('adjust');
    if (adjust) {
      const adjustType = upperFirst(adjust.type);
      if (!Adjust[adjustType]) {
        throw new Error('not support such adjust : ' + adjust);
      }

      const xScale = self.getXScale();
      const yScale = self.getYScale();
      const cfg = mix({
        xField: xScale.field,
        yField: yScale.field
      }, adjust);
      const adjustObject = new Adjust[adjustType](cfg);
      adjustObject.processAdjust(dataArray);
      if (adjustType === 'Stack') {
        self._updateStackRange(yScale.field, yScale, dataArray);
      }
    }
  }

  _updateStackRange(field, scale, dataArray) {
    const mergeArray = ArrayUtil.merge(dataArray);
    let min = scale.min;
    let max = scale.max;
    for (let i = 0, len = mergeArray.length; i < len; i++) {
      const obj = mergeArray[i];
      const tmpMin = Math.min.apply(null, obj[field]);
      const tmpMax = Math.max.apply(null, obj[field]);
      if (tmpMin < min) {
        min = tmpMin;
      }
      if (tmpMax > max) {
        max = tmpMax;
      }
    }
    if (min < scale.min || max > scale.max) {
      scale.change({
        min,
        max
      });
    }
  }

  _sort(mappedArray) {
    const self = this;
    const xScale = self.getXScale();
    const { field, type } = xScale;
    if (type !== 'identity' && xScale.values.length > 1) {
      each(mappedArray, itemArr => {
        itemArr.sort((obj1, obj2) => {
          if (type === 'timeCat') {
            return toTimeStamp(obj1[FIELD_ORIGIN][field]) - toTimeStamp(obj2[FIELD_ORIGIN][field]);
          }
          return xScale.translate(obj1[FIELD_ORIGIN][field]) - xScale.translate(obj2[FIELD_ORIGIN][field]);
        });
      });
    }

    self.set('hasSorted', true);
    self.set('dataArray', mappedArray);
  }

  paint() {
    const self = this;
    const dataArray = self.get('mappingData');
    const mappedArray = [];
    const shapeFactory = self.getShapeFactory();
    shapeFactory.setCoord(self.get('coord'));
    self._beforeMapping(dataArray);
    for (let i = 0, len = dataArray.length; i < len; i++) {
      const data = dataArray[i];
      if (data.length) {
        const mappedData = self._mapping(data);
        mappedArray.push(mappedData);
        self.draw(mappedData, shapeFactory);
      }
    }
    this._initAnimate();
    self.set('dataArray', mappedArray);
  }

  getShapeFactory() {
    let shapeFactory = this.get('shapeFactory');
    if (!shapeFactory) {
      const shapeType = this.get('shapeType');
      shapeFactory = GeometryShape.getShapeFactory(shapeType);
      this.set('shapeFactory', shapeFactory);
    }
    return shapeFactory;
  }

  _mapping(data) {
    const self = this;
    const attrs = self.get('attrs');
    const yField = self.getYScale().field;

    // 用来缓存转换的值，减少mapping耗时
    const mappedCache = {};
    const mappedData = new Array(data.length);

    for (const k in attrs) {
      if (attrs.hasOwnProperty(k)) {
        const attr = attrs[k];
        const names = attr.names;
        const scales = attr.scales;

        for (let i = 0, len = data.length; i < len; i++) {
          const record = data[i];
          const mappedRecord = {
            ...record,
            ...mappedData[i]
          };
          mappedRecord[FIELD_ORIGIN_Y] = record[yField];

          // 获取视觉属性对应的value值
          // 位置的缓存命中率低，还是每次单独计算
          if (attr.type === 'position') {
            const values = self._getAttrValues(attr, record);
            for (let j = 0, len = values.length; j < len; j++) {
              const val = values[j];
              const name = names[j];
              mappedRecord[name] = (isArray(val) && val.length === 1) ? val[0] : val;
            }
          } else {
            // 除了position其他都只有一项
            const name = names[0];
            const field = scales[0].field;
            const value = record[field];
            const key = `${name}${value}`;
            let values = mappedCache[key];
            if (!values) {
              values = self._getAttrValues(attr, record);
              mappedCache[key] = values;
            }
            mappedRecord[name] = values[0];
          }
          // 设置新数组
          mappedData[i] = mappedRecord;
        }
      }
    }
    return mappedData;
  }

  _getAttrValues(attr, record) {
    const scales = attr.scales;
    const params = [];
    for (let i = 0, len = scales.length; i < len; i++) {
      const scale = scales[i];
      const field = scale.field;
      if (scale.type === 'identity') {
        params.push(scale.value);
      } else {
        params.push(record[field]);
      }
    }
    const values = attr.mapping(...params);
    return values;
  }

  getAttrValue(attrName, record) {
    const attr = this.getAttr(attrName);
    let rst = null;
    if (attr) {
      const values = this._getAttrValues(attr, record);
      rst = values[0];
    }
    return rst;
  }

  _beforeMapping(dataArray) {
    const self = this;
    if (self.get('generatePoints')) {
      self._generatePoints(dataArray);
    }
  }

  isInCircle() {
    const coord = this.get('coord');
    return coord && coord.isPolar;
  }

  getCallbackCfg(fields, cfg, origin) {
    if (!fields) {
      return cfg;
    }
    const tmpCfg = {};
    const params = fields.map(function(field) {
      return origin[field];
    });
    each(cfg, function(v, k) {
      if (isFunction(v)) {
        tmpCfg[k] = v.apply(null, params);
      } else {
        tmpCfg[k] = v;
      }
    });
    return tmpCfg;
  }

  getDrawCfg(obj) {
    const self = this;
    const isInCircle = self.isInCircle();
    const cfg = {
      origin: obj,
      x: obj.x,
      y: obj.y,
      color: obj.color,
      size: obj.size,
      shape: obj.shape,
      isInCircle,
      opacity: obj.opacity
    };
    const styleOptions = self.get('styleOptions');
    if (styleOptions && styleOptions.style) {
      cfg.style = self.getCallbackCfg(styleOptions.fields, styleOptions.style, obj[FIELD_ORIGIN]);
    }
    if (self.get('generatePoints')) {
      cfg.points = obj.points;
      cfg.nextPoints = obj.nextPoints;
    }
    if (isInCircle) {
      cfg.center = self.get('coord').center;
    }
    return cfg;
  }

  draw(data, shapeFactory) {
    const self = this;
    const container = self.get('container');
    const yScale = self.getYScale();
    each(data, function(obj, index) {
      if (yScale && isNil(obj._origin[yScale.field])) {
        return;
      }
      obj.index = index;
      const cfg = self.getDrawCfg(obj);
      const shape = obj.shape;
      self.drawShape(shape, obj, cfg, container, shapeFactory);
    });
  }

  drawShape(shape, shapeData, cfg, container, shapeFactory) {
    const gShape = shapeFactory.drawShape(shape, cfg, container);

    if (gShape) {
      each([].concat(gShape), s => {
        s.set('origin', shapeData);
      });
    }
  }

  _getAnimate(shape) {
    const cache = {}; // TODO: 需要取实际缓存内容
    const animateCfg = this.get('animateCfg');
    const isUpdate = this.get('chart').get('isUpdate');
    if (!animateCfg) return;
    const { id } = shape;
    // 说明一定是更新的
    if (cache[id]) {
      return animateCfg.update;
    }
    if (isUpdate) {
      return animateCfg.enter;
    }
    return animateCfg.appear;
  }

  // 设置图形的动画
  _initAnimate() {
    const container = this.get('container');
    const animateCfg = this.get('animateCfg');
    if (!animateCfg) return;
    const children = container.get('children');
    for (let i = 0, len = children.length; i < len; i++) {
      const child = children[i];
      const animate = this._getAnimate(child);
      const { animation: animationName } = animate;
      const animation = getAnimation(animationName);
      if (animation) {
        // 群组动画，通过约定区别
        if (/^group/.test(animationName)) {
          return animation(container, animate, this.get('coord'));
        }
        animation(child, animate, this.get('coord'));
      }
    }
    // TODO: 处理离场的shape
  }

  _generatePoints(dataArray) {
    const self = this;
    const shapeFactory = self.getShapeFactory();
    const shapeAttr = self.getAttr('shape');
    each(dataArray, function(data) {
      for (let i = 0, len = data.length; i < len; i++) {
        const obj = data[i];
        const cfg = self.createShapePointsCfg(obj);
        const shape = shapeAttr ? self._getAttrValues(shapeAttr, obj) : null;
        const points = shapeFactory.getShapePoints(shape, cfg);
        obj.points = points;
      }
    });
    // 添加nextPoints
    each(dataArray, (data, index) => {
      const nextData = dataArray[index + 1];
      if (nextData) {
        data[0].nextPoints = nextData[0].points;
      }
    });
  }

  /**
   * get the info of each shape
   * @protected
   * @param  {Object} obj the data item
   * @return {Object} cfg return the result
   */
  createShapePointsCfg(obj) {
    const xScale = this.getXScale();
    const yScale = this.getYScale();
    const x = this._normalizeValues(obj[xScale.field], xScale);
    let y;

    if (yScale) {
      y = this._normalizeValues(obj[yScale.field], yScale);
    } else {
      y = obj.y ? obj.y : 0.1;
    }

    return {
      x,
      y,
      y0: yScale ? yScale.scale(this.getYMinValue()) : undefined
    };
  }

  getYMinValue() {
    const yScale = this.getYScale();
    const { min, max } = yScale;
    let value;

    if (this.get('startOnZero')) {
      if (max <= 0 && min <= 0) {
        value = max;
      } else {
        value = min >= 0 ? min : 0;
      }
    } else {
      value = min;
    }

    return value;
  }

  _normalizeValues(values, scale) {
    let rst = [];
    if (isArray(values)) {
      for (let i = 0, len = values.length; i < len; i++) {
        const v = values[i];
        rst.push(scale.scale(v));
      }
    } else {
      rst = scale.scale(values);
    }
    return rst;
  }

  getAttr(name) {
    return this.get('attrs')[name];
  }

  getXScale() {
    return this.getAttr('position').scales[0];
  }

  getYScale() {
    return this.getAttr('position').scales[1];
  }

  hasAdjust(adjust) {
    return this.get('adjust') && (this.get('adjust').type === adjust);
  }

  _getSnap(scale, item, arr) {
    let i = 0;
    let values;
    const yField = this.getYScale().field; // 叠加的维度
    if (this.hasAdjust('stack') && scale.field === yField) {
      values = [];
      arr.forEach(function(obj) {
        values.push(obj[FIELD_ORIGIN_Y]);
      });

      for (let len = values.length; i < len; i++) {
        if (values[0][0] > item) {
          break;
        }
        if (values[values.length - 1][1] <= item) {
          i = values.length - 1;
          break;
        }
        if (values[i][0] <= item && values[i][1] > item) {
          break;
        }
      }
    } else {
      values = scale.values;
      values.sort((a, b) => {
        return a - b;
      });
      for (let len = values.length; i < len; i++) {
        // 如果只有1个点直接返回第1个点
        if (len <= 1) {
          break;
        }
        // 第1个点和第2个点之间
        if ((values[0] + values[1]) / 2 > item) {
          break;
        }
        // 中间的点
        if ((values[i - 1] + values[i]) / 2 <= item && (values[i + 1] + values[i]) / 2 > item) {
          break;
        }
        // 最后2个点
        if ((values[values.length - 2] + values[values.length - 1]) / 2 <= item) {
          i = values.length - 1;
          break;
        }
      }
    }
    const result = values[i];
    return result;
  }

  getSnapRecords(point) {
    const self = this;
    const coord = self.get('coord');
    const xScale = self.getXScale();
    const yScale = self.getYScale();
    const xfield = xScale.field;

    const dataArray = self.get('dataArray');
    if (!this.get('hasSorted')) {
      this._sort(dataArray);
    }

    let rst = [];
    const invertPoint = coord.invertPoint(point);
    let invertPointX = invertPoint.x;
    if (self.isInCircle() && !coord.transposed && invertPointX > (1 + xScale.rangeMax()) / 2) {
      invertPointX = xScale.rangeMin();
    }

    let xValue = xScale.invert(invertPointX);
    if (!xScale.isCategory) {
      xValue = self._getSnap(xScale, xValue);
    }

    const tmp = [];

    dataArray.forEach(function(data) {
      data.forEach(function(obj) {
        const originValue = isNil(obj[FIELD_ORIGIN]) ? obj[xfield] : obj[FIELD_ORIGIN][xfield];
        if (self._isEqual(originValue, xValue, xScale)) {
          tmp.push(obj);
        }
      });
    });

    // special for pie chart
    if (this.hasAdjust('stack') && coord.isPolar && coord.transposed) {
      if (invertPointX >= 0 && invertPointX <= 1) {
        let yValue = yScale.invert(invertPoint.y);
        yValue = self._getSnap(yScale, yValue, tmp);
        tmp.forEach(obj => {
          if (isArray(yValue) ? obj[FIELD_ORIGIN_Y].toString() === yValue.toString() : obj[FIELD_ORIGIN_Y] === yValue) {
            rst.push(obj);
          }
        });
      }

    } else {
      rst = tmp;
    }

    return rst;
  }

  getRecords(value) {
    const xScale = this.getXScale();
    const dataArray = this.get('dataArray');
    const xfield = xScale.field;

    return dataArray.map(data => {
      for (let len = data.length, i = len - 1; i >= 0; i--) {
        const obj = data[i];
        const originValue = isNil(obj[FIELD_ORIGIN]) ? obj[xfield] : obj[FIELD_ORIGIN][xfield];
        if (this._isEqual(originValue, value, xScale)) {
          return obj;
        }
      }
      return null;
    });
  }

  _isEqual(originValue, value, scale) {
    if (scale.type === 'timeCat') {
      return toTimeStamp(originValue) === value;
    }
    return value === originValue;
  }

  position(field) {
    this._setAttrOptions('position', {
      field
    });
    return this;
  }

  color(field, values) {
    this._createAttrOption('color', field, values, Global.colors);
    return this;
  }

  size(field, values) {
    this._createAttrOption('size', field, values, Global.sizes);
    return this;
  }

  shape(field, values) {
    const type = this.get('type');
    const shapes = Global.shapes[type] || [];
    this._createAttrOption('shape', field, values, shapes);
    return this;
  }

  style(field, cfg) {
    let styleOptions = this.get('styleOptions');
    if (!styleOptions) {
      styleOptions = {};
      this.set('styleOptions', styleOptions);
    }
    if (isObject(field)) {
      cfg = field;
      field = null;
    }
    let fields;
    if (field) {
      fields = parseFields(field);
    }
    styleOptions.fields = fields;
    styleOptions.style = cfg;
    return this;
  }

  adjust(type) {
    if (isString(type)) {
      type = { type };
    }
    this.set('adjust', type);
    return this;
  }

  animate(cfg) {
    this.set('animateCfg', cfg);
    return this;
  }

  changeData(data) {
    this.set('data', data);
    // 改变数据后，情况度量，因为需要重新实例化
    this.set('scales', {});
    if (!this.get('isInit')) return;
    this.set('isInit', false);
    this.init();
  }

  clearInner() {
    const container = this.get('container');
    if (container) {
      container.clear();
      // container.setMatrix([ 1, 0, 0, 1, 0, 0 ]);
    }
  }

  reset() {
    this.set('isInit', false);
    this.set('attrs', {});
    this.set('attrOptions', {});
    this.set('adjust', null);
    this.clearInner();
  }

  clear() {
    this.clearInner();
  }

  destroy() {
    this.set('isInit', false);
    this.clear();
    super.destroy();
  }

  _display(visible) {
    this.set('visible', visible);
    const container = this.get('container');
    const canvas = container.get('canvas');
    container.set('visible', visible);
    canvas.draw();
  }

  show() {
    this._display(true);
  }

  hide() {
    this._display(false);
  }
}

export default Geom;
