import { isNil, upperFirst } from '../util/common';
import Element from './element';
import * as Easing from './anim/easing';

class Shape extends Element {
  _initProperties() {
    this._attrs = {
      fillOpacity: 1,
      zIndex: 0,
      visible: true,
      destroyed: false,
      isShape: true,
      attrs: {}
    };
  }

  getType() {
    return this._attrs.type;
  }

  drawInner(context) {
    const self = this;
    const attrs = self.get('attrs');
    self.createPath(context);
    const originOpacity = context.globalAlpha;
    if (self.hasFill()) {
      const fillOpacity = attrs.fillOpacity;
      if (!isNil(fillOpacity) && fillOpacity !== 1) {
        context.globalAlpha = fillOpacity;
        context.fill();
        context.globalAlpha = originOpacity;
      } else {
        context.fill();
      }
    }
    if (self.hasStroke()) {
      const lineWidth = attrs.lineWidth;
      if (lineWidth > 0) {
        const strokeOpacity = attrs.strokeOpacity;
        if (!isNil(strokeOpacity) && strokeOpacity !== 1) {
          context.globalAlpha = strokeOpacity;
        }
        context.stroke();
      }
    }
  }

  getBBox() {
    let bbox = this._attrs.bbox;
    if (!bbox) {
      bbox = this.calculateBox();
      if (bbox) {
        bbox.x = bbox.minX;
        bbox.y = bbox.minY;
        bbox.width = bbox.maxX - bbox.minX;
        bbox.height = bbox.maxY - bbox.minY;
      }
      this._attrs.bbox = bbox;
    }
    return bbox;
  }

  calculateBox() {
    return null;
  }

  createPath() {}

  // animate(cfg) {
  //   this.set('animate', cfg);
  // }

  // 动画
  to(time) {
    const animateCfg = this.get('animate') || {};
    const animateType = this.get('animateType');
    const animate = animateCfg[animateType];
    if (!animate) return;
    const { startAttrs, endAttrs } = this._attrs;
    const {
      property,
      duration,
      easing = 'linear',
      delay = 0
    } = animate;
    // 未开始
    if (time <= delay) {
      return;
    }
    this.attr(endAttrs);
    if (time >= delay + duration) {
      return;
    }
    const easingFn = typeof easing === 'function' ? easing : Easing[easing];
    const t = easingFn((time - delay) / duration);
    for (let i = 0, len = property.length; i < len; i++) {
      const attrName = property[i];
      let diff = endAttrs[attrName] - startAttrs[attrName];
      if (attrName === 'fillOpacity' && isNil(endAttrs.fillOpacity)) {
        diff = 1;
      }
      this.transition(attrName, diff, t, endAttrs);
    }
  }
}

function createShape(type, cfg = {}) {
  const shapeType = upperFirst(type);
  const shapeClass = Shape[shapeType];
  const { canvas } = cfg;
  if (shapeType === 'Text' && canvas && canvas.get('fontFamily')) {
    cfg.attrs.fontFamily = cfg.attrs.fontFamily || canvas.get('fontFamily');
  }
  return new shapeClass(cfg);
}

export default Shape;
export { createShape };
