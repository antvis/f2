import { quadraticOut, quadraticIn, cubicIn, cubicOut } from './easing';
import { requestAnimationFrame } from '../util/requestAnimationFrame';
import { deepMix } from '../../util/common';
const clock = typeof performance === 'object' && performance.now ? performance : Date;

const easing = [
  quadraticOut, quadraticIn, cubicIn, cubicOut,
  quadraticOut, quadraticIn, cubicIn, cubicOut
];

class Animate {
  duration = 2000;

  constructor(canvas) {
    this.canvas = canvas;
  }

  play() {
    if (this.playing) {
      return;
    }
    this.beforePlay();
    const startTime = clock.now();
    const duration = this.duration;
    this.playing = true;

    const play = () => {
      const now = clock.now();
      const time = now - startTime;
      if (time >= duration) {
        this.update(duration);
        return;
      }
      this.update(time);
      requestAnimationFrame(play);
    };

    requestAnimationFrame(play);
  }

  beforePlay() {
    const geometryGroup = this.canvas.get('children')[1].get('children')[0];
    const children = geometryGroup.get('children');
    children.forEach(shape => {
      if (!shape._attrs.target) {
        shape._attrs.target = deepMix({}, shape._attrs.attrs);
        shape.attr({
          height: 0
        });
      }
    });
  }

  getTree() {
    // const geometryGroup = this.canvas.get('children')[1].get('children')[0];
    // const children = geometryGroup.get('children');
    // return children.map((child, index) => {
    //   return {
    //     index,
    //     duration: 1000,
    //     start: 0,
    //     shape: child
    //   };
    // });


    const geometryGroup = this.canvas.get('children')[1].get('children')[0];
    const children = geometryGroup.get('children');
    let child;
    for (let i = children.length - 1; i >= 0; i--) {
      const shape = children[i];
      const item = {
        index: i,
        duration: 400,
        start: i * 400,
        shape
      };
      if (child) {
        item.children = [ child ];
      }
      child = item;
    }
    return [ child ];
  }

  updateShape(root, time) {
    root.forEach(child => {
      const {
        duration,
        start,
        shape,
        children,
        index
      } = child;
      // 时间还没到当前shape
      if (time < start) {
        return;
      }
      const t = Math.min((time - start) / duration, 1);
      const { height, y } = shape._attrs.target;

      const diff = height * easing[index](t);

      shape.attr({
        height: diff,
        y: (y + height) - diff
      });


      if (children && children.length) {
        this.updateShape(children, time);
      }
    });
  }

  update(time) {
    const tree = this.getTree();
    this.updateShape(tree, time);
    this.canvas.draw();
  }

  stop() {
  }

}

export default Animate;
