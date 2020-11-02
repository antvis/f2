import * as Easing from './easing';

class Animator {
  start = 0;

  constructor(shape) {
    this.shape = shape;
  }

  animate(cfg) {
    const {
      property,
      delay,
      duration,
      attrs,
      easing
    } = cfg;

    let easingFn;
    if (typeof easing === 'function') {
      easingFn = easing;
    } else {
      easingFn = Easing[easing] || Easing.linear;
    }

    this.property = property;
    this.delay = delay;
    this.duration = duration;
    this.attrs = attrs;
    this.easing = easingFn;
  }

  update(time) {
    const { delay, duration } = this;
    if (time <= delay) {
      return;
    }
    let t = 1;
    if (time < delay + duration) {
      t = (duration + delay - time) / duration;
    }
    this.updateAttrs(t);
  }

  updateAttrs(t) {
    const { property } = this;
    if (property) {
      for (let i = 0, len = property.length; i < len; i++) {
        const p = property[i];
      }
    }
  }

  addChild(child) {
    const children = this.children || [];
    children.push(child);
    this.children = children;
  }
}

export default Animator;
