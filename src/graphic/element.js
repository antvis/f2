import { mix, isObject, isArray, Array as ArrayUtil } from '../util/common';
import MatrixUtil from './util/matrix';
import Vector2 from './util/vector2';
import { parseStyle } from './util/style-parse';
import * as Easing from './anim/easing';

const ALIAS_ATTRS_MAP = {
  stroke: 'strokeStyle',
  fill: 'fillStyle',
  opacity: 'globalAlpha'
};

const SHAPE_ATTRS = [
  'fillStyle',
  'font',
  'globalAlpha',
  'lineCap',
  'lineWidth',
  'lineJoin',
  'miterLimit',
  'shadowBlur',
  'shadowColor',
  'shadowOffsetX',
  'shadowOffsetY',
  'strokeStyle',
  'textAlign',
  'textBaseline',
  'lineDash',
  'shadow' // 兼容支付宝小程序
];

const CLIP_SHAPES = [ 'circle', 'sector', 'polygon', 'rect', 'polyline' ];


function interpolateNumber(a, b, t) {
  a = +a;
  b -= a;
  return a + b * t;
}

function interpolateArray(a, b, t) {
  const nb = b ? b.length : 0;
  const na = a ? Math.min(nb, a.length) : 0;
  const x = new Array(na);
  let i;

  for (i = 0; i < na; ++i) x[i] = interpolateNumber(a[i], b[i], t);

  return x;
}

class Element {
  _initProperties() {
    this._attrs = {
      zIndex: 0,
      visible: true,
      destroyed: false
    };
  }

  constructor(cfg) {
    this._initProperties();
    mix(this._attrs, cfg);

    const attrs = this._attrs.attrs;
    if (attrs) {
      this.initAttrs(attrs);
    }

    this.initTransform();
    this.initAnimate();
  }

  get(name) {
    return this._attrs[name];
  }

  set(name, value) {
    this._attrs[name] = value;
  }

  isGroup() {
    return this.get('isGroup');
  }

  isShape() {
    return this.get('isShape');
  }

  initAttrs(attrs) {
    this.attr(mix(this.getDefaultAttrs(), attrs));
  }

  getDefaultAttrs() {
    return {};
  }

  _setAttr(name, value) {
    const attrs = this._attrs.attrs;
    if (name === 'clip') {
      value = this._setAttrClip(value);
    } else {
      const alias = ALIAS_ATTRS_MAP[name];
      if (alias) {
        attrs[alias] = value;
      }
    }
    attrs[name] = value;
  }

  _getAttr(name) {
    return this._attrs.attrs[name];
  }

  // _afterAttrsSet() {}

  _setAttrClip(clip) {
    if (clip && (CLIP_SHAPES.indexOf(clip._attrs.type) > -1)) {
      if (clip.get('canvas') === null) {
        clip = Object.assign({}, clip);
      }
      clip.set('parent', this.get('parent'));
      clip.set('context', this.get('context'));
      return clip;
    }
    return null;
  }

  attr(name, value) {
    const self = this;
    if (self.get('destroyed')) return null;
    const argumentsLen = arguments.length;
    if (argumentsLen === 0) {
      return self._attrs.attrs;
    }

    if (isObject(name)) {
      this._attrs.bbox = null;
      for (const k in name) {
        self._setAttr(k, name[k]);
      }
      if (self._afterAttrsSet) {
        self._afterAttrsSet();
      }
      return self;
    }
    if (argumentsLen === 2) {
      this._attrs.bbox = null;
      self._setAttr(name, value);
      if (self._afterAttrsSet) {
        self._afterAttrsSet();
      }
      return self;
    }
    return self._getAttr(name);
  }

  getParent() {
    return this.get('parent');
  }

  draw(context) {
    if (this.get('destroyed')) {
      return;
    }
    if (this.get('visible')) {
      this.setContext(context);
      this.drawInner(context);
      this.restoreContext(context);
    }
  }

  setContext(context) {
    const clip = this._attrs.attrs.clip;
    context.save();
    if (clip) {
      clip.resetTransform(context);
      clip.createPath(context);
      context.clip();
    }
    this.resetContext(context);
    this.resetTransform(context);
  }

  restoreContext(context) {
    context.restore();
  }

  resetContext(context) {
    const elAttrs = this._attrs.attrs;
    if (!this._attrs.isGroup) {
      for (const k in elAttrs) {
        if (SHAPE_ATTRS.indexOf(k) > -1) {
          let v = elAttrs[k];
          if (k === 'fillStyle' || k === 'strokeStyle') {
            v = parseStyle(v, this, context);
          }
          if (k === 'lineDash' && context.setLineDash && isArray(v)) {
            context.setLineDash(v);
          } else {
            context[k] = v;
          }
        }
      }
    }
  }

  hasFill() {
    return this.get('canFill') && this._attrs.attrs.fillStyle;
  }

  hasStroke() {
    return this.get('canStroke') && this._attrs.attrs.strokeStyle;
  }

  drawInner(/* context */) {

  }

  show() {
    this.set('visible', true);
    return this;
  }

  hide() {
    this.set('visible', false);
    return this;
  }

  isVisible() {
    return this.get('visible');
  }

  _removeFromParent() {
    const parent = this.get('parent');
    if (parent) {
      const children = parent.get('children');
      ArrayUtil.remove(children, this);
    }

    return this;
  }

  remove(destroy) {
    if (destroy) {
      this.destroy();
    } else {
      this._removeFromParent();
    }
  }

  destroy() {
    const destroyed = this.get('destroyed');

    if (destroyed) {
      return null;
    }

    this._removeFromParent();

    this._attrs = {};
    this.set('destroyed', true);
  }

  getBBox() {
    return {
      minX: 0,
      maxX: 0,
      minY: 0,
      maxY: 0,
      width: 0,
      height: 0
    };
  }

  initTransform() {
    const attrs = this._attrs.attrs || {};
    if (!attrs.matrix) {
      attrs.matrix = [ 1, 0, 0, 1, 0, 0 ];
    }
    this._attrs.attrs = attrs;
  }

  getMatrix() {
    return this._attrs.attrs.matrix;
  }

  setMatrix(m) {
    this._attrs.attrs.matrix = [ m[0], m[1], m[2], m[3], m[4], m[5] ];
  }

  transform(actions) {
    const matrix = this._attrs.attrs.matrix;
    this._attrs.attrs.matrix = MatrixUtil.transform(matrix, actions);
    return this;
  }

  setTransform(actions) {
    this._attrs.attrs.matrix = [ 1, 0, 0, 1, 0, 0 ];
    return this.transform(actions);
  }

  translate(x, y) {
    const matrix = this._attrs.attrs.matrix;
    MatrixUtil.translate(matrix, matrix, [ x, y ]);
  }

  rotate(rad) {
    const matrix = this._attrs.attrs.matrix;
    MatrixUtil.rotate(matrix, matrix, rad);
  }

  scale(sx, sy) {
    const matrix = this._attrs.attrs.matrix;
    MatrixUtil.scale(matrix, matrix, [ sx, sy ]);
  }

  moveTo(x, y) {
    const cx = this._attrs.x || 0;
    const cy = this._attrs.y || 0;
    this.translate(x - cx, y - cy);
    this.set('x', x);
    this.set('y', y);
  }

  apply(v) {
    const m = this._attrs.attrs.matrix;
    Vector2.transformMat2d(v, v, m);
    return this;
  }

  resetTransform(context) {
    const mo = this._attrs.attrs.matrix;
    if (MatrixUtil.isChanged(mo)) {
      context.transform(mo[0], mo[1], mo[2], mo[3], mo[4], mo[5]);
    }
  }

  initAnimate() {
    const { animate } = this._attrs;
    if (!animate) return;
    const { clip, start: startState, attrs } = animate;
    let animateElement;
    if (clip) {
      animateElement = clip;
      this.attr('clip', clip);
    } else {
      animateElement = this;
    }
    const property = Object.keys(attrs);
    if (startState) {
      animateElement.attr(startState);
    }
    const start = {
      ...animateElement.getDefaultAttrs(),
      ...startState
    };
    // 设置成动画初始状态
    for (let i = 0, len = property.length; i < len; i++) {
      const attrName = property[i];
      animateElement.attr(attrName, start[attrName]);
    }

    animate.property = property;
    animate.start = start;
  }

  animate(cfg) {
    this.set('animate', cfg);
    this.initAnimate();
  }

  animateTo(time) {
    const { animate } = this._attrs;
    if (!animate) return;
    const {
      clip,
      property,
      duration,
      easing = 'linear',
      delay = 0,
      start,
      attrs
    } = animate;
    const animateElement = clip ? clip : this;
    if (!animateElement) return;
    // 未开始
    if (time <= delay) {
      return;
    }
    // 动画结束
    if (time >= delay + duration) {
      // 清空裁剪区
      if (clip) {
        this.attr('clip', null);
        return;
      }
      for (let i = 0, len = property.length; i < len; i++) {
        const attrName = property[i];
        animateElement.attr(attrName, attrs[attrName]);
      }
      return;
    }
    const easingFn = typeof easing === 'function' ? easing : Easing[easing];
    const t = easingFn((time - delay) / duration);
    for (let i = 0, len = property.length; i < len; i++) {
      const attrName = property[i];
      let attrValue = start[attrName] + (attrs[attrName] - start[attrName]) * t;
      if (attrName === 'matrix') {
        attrValue = interpolateArray(start[attrName], attrs[attrName], t);
      }
      animateElement.attr(attrName, attrValue);
    }
  }

  isDestroyed() {
    return this.get('destroyed');
  }

  // 动画播放到t帧
  to() {

  }
  transition(name, diff, t, end) {
    const value = end[name] - (1 - t) * diff;
    this.attr(name, value);
  }
}

export default Element;
