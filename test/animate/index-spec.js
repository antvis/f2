import { Canvas, createShape } from '../../src/graphic/index';
// import Animate from '../../src/graphic/anim/animate';

const canvasEl = document.createElement('canvas');
document.body.appendChild(canvasEl);

describe('index', () => {
  it('index', () => {
    const canvas = new Canvas({
      el: canvasEl,
      width: 350,
      height: 300,
      pixelRatio: 2
    });

    const group = canvas.addGroup({
      animate: {
        clip: createShape('rect'),
        duration: 1000,
        easing: 'quadraticOut',
        delay: 10,
        start: {
          height: 300
        },
        attrs: {
          width: 350
        }
      }
    });

    group.addShape('rect', {
      attrs: {
        x: 10,
        y: 10,
        width: 300,
        height: 30,
        fill: '#18901f'
      }
    });

    group.addShape('rect', {
      attrs: {
        x: 60,
        y: 60,
        width: 30,
        height: 30,
        fill: '#18901f'
      }
    });

    canvas.addShape('rect', {
      attrs: {
        x: 110,
        y: 110,
        width: 30,
        height: 30,
        fill: '#18901f'
      },
      animate: {
        duration: 1000,
        easing: 'cubicOut',
        delay: 10,
        attrs: {
          width: 30,
          height: 30
        }
      }
    });


    const polyline = canvas.addShape('polyline', {
      attrs: {
        points: [
          { x: 10, y: 10 },
          { x: 50, y: 10 },
          { x: 60, y: 30 },
          { x: 80, y: 60 },
          { x: 100, y: 100 }
        ],
        lineWidth: 2,
        stroke: 'red',
        smooth: true
      },
      animate: {
        clip: createShape('rect'),
        duration: 1000,
        easing: 'quadraticOut',
        delay: 10,
        attrs: {
          width: 100,
          height: 100
        }
      }
    });

    // polyline.animateTo(100);

    console.log(polyline);

    // canvas._drawInner();
    canvas.draw();

    // const animate = new Animate(canvas);
    // animate.play();
  });
});
