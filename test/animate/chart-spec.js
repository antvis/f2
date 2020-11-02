import F2 from '../../src/index';

const canvas = document.createElement('canvas');
canvas.style.width = '350px';
canvas.style.height = '300px';
document.body.appendChild(canvas);

const timelineEl = document.createElement('div');
document.body.appendChild(timelineEl);

const playEl = document.createElement('button');
playEl.innerHTML = '播放';
document.body.appendChild(playEl);

describe('index', () => {
  it('index', () => {
    // F2 对数据源格式的要求，仅仅是 JSON 数组，数组的每个元素是一个标准 JSON 对象。
    const data = [
      { genre: 'Sports', sold: 275, type: 'a' },
      { genre: 'Strategy', sold: 115, type: 'a' },
      { genre: 'Action', sold: 120, type: 'a' },
      { genre: 'Shooter', sold: 350, type: 'a' },
      { genre: 'Other', sold: 150, type: 'a' }

      // { genre: 'Sports', sold: 75, type: 'b' },
      // { genre: 'Strategy', sold: 135, type: 'b' },
      // { genre: 'Action', sold: 220, type: 'b' },
      // { genre: 'Shooter', sold: 250, type: 'b' },
      // { genre: 'Other', sold: 180, type: 'b' }
    ];

    // Step 1: 创建 Chart 对象
    const chart = new F2.Chart({
      el: canvas,
      pixelRatio: window.devicePixelRatio // 指定分辨率
    });

    // Step 2: 载入数据源
    chart.source(data);

    // chart.coord('polar', {
    //   innerRadius: 0.2
    // });

    // Step 3：创建图形语法，绘制柱状图，由 genre 和 sold 两个属性决定图形位置，genre 映射至 x 轴，sold 映射至 y 轴
    // chart.line()
    //   .position('genre*sold')
    //   .color('type')
    //   .shape('smooth')
    //   .animate({
    //     appear: {
    //       type: 'sequential',
    //       property: [ 'width' ],
    //       duration: 600,
    //       easing: 'quadraticOut',
    //       delay: 0
    //     },
    //     enter: {
    //       // type: 'sequential', // parallel or sequential, default: parallel
    //       property: [ 'width' ],
    //       duration: 600,
    //       easing: 'quadraticOut',
    //       delay: 0
    //     },
    //     update: {
    //       property: [ 'height' ],
    //       duration: 600,
    //       easing: 'quadraticOut',
    //       delay: 0
    //     }
    //   });
    // chart.line()
    //   .position('genre*sold')
    //   .color('type')
    //   .shape('smooth')
    //   .animate({
    //     appear: {
    //       type: 'sequential',
    //       property: [ 'width' ],
    //       duration: 600,
    //       easing: 'quadraticOut',
    //       delay: 0
    //     },
    //     enter: {
    //       // type: 'sequential', // parallel or sequential, default: parallel
    //       property: [ 'width' ],
    //       duration: 600,
    //       easing: 'quadraticOut',
    //       delay: 0
    //     },
    //     update: {
    //       property: [ 'height' ],
    //       duration: 600,
    //       easing: 'quadraticOut',
    //       delay: 0
    //     }
    //   });
    // chart.interval()
    //   .position('genre*sold')
    //   .color('type')
    //   .shape('smooth')
    //   .animate({
    //     appear: {
    //       type: 'sequential',
    //       property: [ 'width' ],
    //       duration: 600,
    //       easing: 'quadraticOut',
    //       delay: 0
    //     },
    //     enter: {
    //       // type: 'sequential', // parallel or sequential, default: parallel
    //       property: [ 'width' ],
    //       duration: 600,
    //       easing: 'quadraticOut',
    //       delay: 0
    //     },
    //     update: {
    //       property: [ 'height' ],
    //       duration: 600,
    //       easing: 'quadraticOut',
    //       delay: 0
    //     }
    //   });
    chart.interval()
      .position('genre*sold')
      // .color('type')
      // .shape('smooth')
      .animate({
        appear: {
          type: 'sequential',
          // animation: 'shapeWaveIn',
          // animation: 'groupWaveIn',
          // animation: 'groupScaleInX',
          animation: 'shapeScaleInX',
          duration: 1000,
          easing: 'quadraticOut',
          delay: 0
        },
        enter: {
          // type: 'sequential', // parallel or sequential, default: parallel
          duration: 600,
          easing: 'quadraticOut',
          delay: 0
        },
        update: {
          duration: 600,
          easing: 'quadraticOut',
          delay: 0
        }
      });


    // Step 4: 渲染图表
    chart.render();

    const animate = chart.get('canvas').animate;
    const timeline = animate.timeline;

    playEl.onclick = function() {
      animate.play();
    };

    timeline.on('update', ({ time }) => {
      console.log(time);
      const duration = timeline.duration;

      timelineEl.innerHTML = `
        <div>总时长：${(duration / 1000).toFixed(2)}s</div>
        <div>当前时间：${(time / 1000).toFixed(2)}s</div>
      `;
    });
  });
});
