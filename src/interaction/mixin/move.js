import { each, isNil, uniq, directionEnabled } from '../../util/common';
import { getLimitRange, getFieldRange } from '../helper';
import { getTickMethod } from '../../scale';

const TOUCH_EVENTS = [
  'touchstart',
  'touchmove',
  'touchend',
  'touchStart',
  'touchMove',
  'touchEnd'
];
const DAY_TIMESTAMPS = 86400000;

function _handleMove(e) {
  if (e.type === 'swipe' && e.deltaTime > 350) { // 区分 pan 操作和 swipe 操作
    return null;
  }
  const { currentDeltaX, currentDeltaY, lastPoint } = this;
  let deltaX;
  let deltaY;
  if (TOUCH_EVENTS.indexOf(e.type) !== -1 && e.touches && e.touches[0]) { // support touch and miniprogram
    const currentPoint = e.touches[0];
    deltaX = currentPoint.x - lastPoint.x;
    deltaY = currentPoint.y - lastPoint.y;
    this.lastPoint = currentPoint;
  } else if (currentDeltaX !== null && currentDeltaY !== null) {
    deltaX = e.deltaX - currentDeltaX;
    deltaY = e.deltaY - currentDeltaY;
    this.currentDeltaX = e.deltaX;
    this.currentDeltaY = e.deltaY;
  }

  if (Math.abs(deltaX) > 0 || Math.abs(deltaY) > 0) {
    const lastTimestamp = this._timestamp;
    const now = +new Date();
    if ((now - lastTimestamp) > 16) {
      this._doMove(deltaX, deltaY);
      this._timestamp = now;
    }
  }
}

function _doMove(deltaX, deltaY) {
  const self = this;
  const { mode, chart, limitRange } = self;
  const coord = chart.get('coord');
  const { start, end } = coord;
  const data = chart.get('data');
  if (directionEnabled(mode, 'x') && deltaX !== 0) {
    const xScale = chart.getXScale();
    const xField = xScale.field;
    if (!limitRange[xField]) {
      limitRange[xField] = getLimitRange(data, xScale);
    }

    const coordWidth = end.x - start.x;

    if (xScale.isCategory) {
      self._handleCatScale(xScale, deltaX, coordWidth);
    } else if (xScale.isLinear) {
      self._handleLinearScale(xScale, deltaX, coordWidth, 'x');
    }
    self.xRange = getFieldRange(xScale, limitRange[xField], xScale.type);
  }

  if (directionEnabled(mode, 'y') && deltaY !== 0) {
    const coordHeight = start.y - end.y;
    const yScales = chart.getYScales();
    each(yScales, yScale => {
      const yField = yScale.field;
      if (!limitRange[yField]) {
        limitRange[yField] = getLimitRange(data, yScale);
      }

      yScale.isLinear && self._handleLinearScale(yScale, deltaY, coordHeight, 'y');
    });
    const scale = yScales[0];
    self.yRange = getFieldRange(scale, limitRange[scale.field], scale.type);
  }
  chart.repaint();
}


function _handleLinearScale(scale, delta, range, flag) {
  const { field, min, max } = scale;
  const limitRange = this.limitRange;

  if (min === limitRange[field].min && max === limitRange[field].max) return;

  const ratio = delta / range;
  const panValue = ratio * (max - min);
  let newMax = flag === 'x' ? max - panValue : max + panValue;
  let newMin = flag === 'x' ? min - panValue : min + panValue;
  if (limitRange[field] && !isNil(limitRange[field].min) && newMin <= limitRange[field].min) {
    newMin = limitRange[field].min;
    newMax = (max - min) + newMin;
  }
  if (limitRange[field] && !isNil(limitRange[field].max) && newMax >= limitRange[field].max) {
    newMax = limitRange[field].max;
    newMin = newMax - (max - min);
  }
  this.updateLinearScale(field, newMin, newMax);
}

function _handleCatScale(scale, delta, range) {
  const { type, field, values, ticks, tickCount } = scale;

  const duplicateRemovalValues = uniq(values);

  const originValues = this.limitRange[field];
  const lastValueIndex = originValues.length - 1;
  const currentLength = duplicateRemovalValues.length;
  const speed = this.speed || 1;
  const step = range / (currentLength * speed);

  const firstIndex = originValues.indexOf(duplicateRemovalValues[0]);
  const lastIndex = originValues.indexOf(duplicateRemovalValues[currentLength - 1]);
  let minIndex = firstIndex;
  let maxIndex = lastIndex;

  const ratio = Math.abs(delta / range);
  const panStep = this.step || Math.max(1, parseInt(ratio * currentLength));

  this._panCumulativeDelta += delta;
  minIndex = this._panCumulativeDelta > step ?
    Math.max(0, minIndex - panStep) :
    (this._panCumulativeDelta < -step ? Math.min(lastValueIndex - currentLength + 1, minIndex + panStep) : minIndex);

  maxIndex = Math.min(lastValueIndex, minIndex + currentLength - 1);

  if (minIndex === firstIndex && maxIndex === lastIndex) {
    return null;
  }

  const newValues = originValues.slice(minIndex, maxIndex + 1);
  let newTicks = null;
  if (type === 'timeCat') {
    const tickGap = ticks.length > 2 ? ticks[1] - ticks[0] : DAY_TIMESTAMPS;

    if (this._panCumulativeDelta > step) {
      for (let i = ticks[0] - tickGap; i >= newValues[0]; i -= tickGap) {
        ticks.unshift(i);
      }
    } else if (this._panCumulativeDelta < -step) {
      for (let i = ticks[ticks.length - 1] + tickGap; i <= newValues[newValues.length - 1]; i += tickGap) {
        ticks.push(i);
      }
    }
    newTicks = ticks;
  } else if (type === 'cat') {
    const catTicks = getTickMethod('cat');
    newTicks = catTicks({
      tickCount,
      values: newValues
    });
  } else {
    // 保留之前的ticks
    newTicks = ticks;
  }

  this.updateCatScale(field, newValues, newTicks, originValues, minIndex, maxIndex);
  this._panCumulativeDelta = minIndex !== firstIndex ? 0 : this._panCumulativeDelta;
}

export {
  _handleMove,
  _doMove,
  _handleLinearScale,
  _handleCatScale
};

export default {
  _handleMove,
  _doMove,
  _handleLinearScale,
  _handleCatScale
};
