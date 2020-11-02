import { createShape } from '../index';
import { getScaledMatrix } from '../../animation/util';
const Animation = {};

function registerAnimation(animationName, animation) {
  Animation[animationName] = animation;
}

function getAnimation(animationName) {
  return Animation[animationName];
}


registerAnimation('groupWaveIn', function(group, animate, coord) {
  const { start, end, isPolar, circleRadius, center, startAngle, endAngle } = coord;
  const width = Math.abs(end.x - start.x);
  const height = Math.abs(end.y - start.y);
  // 级坐标下
  if (isPolar) {
    group.animate({
      ...animate,
      clip: createShape('Sector'),
      start: {
        x: center.x,
        y: center.y,
        r: circleRadius,
        r0: 0,
        startAngle,
        endAngle: startAngle
      },
      attrs: {
        endAngle
      }
    });
    return;
  }
  group.animate({
    ...animate,
    clip: createShape('Rect'),
    start: {
      x: start.x,
      y: end.y,
      height
    },
    attrs: {
      width
    }
  });
});

registerAnimation('shapeWaveIn', function(group, animate, coord) {
  const { start, end, isPolar, circleRadius, center, startAngle, endAngle } = coord;
  const width = Math.abs(end.x - start.x);
  const height = Math.abs(end.y - start.y);
  // 级坐标下
  if (isPolar) {
    group.animate({
      ...animate,
      clip: createShape('Sector'),
      start: {
        x: center.x,
        y: center.y,
        r: circleRadius,
        r0: 0,
        startAngle,
        endAngle: startAngle
      },
      attrs: {
        endAngle
      }
    });
    return;
  }
  group.animate({
    ...animate,
    clip: createShape('Rect'),
    start: {
      x: start.x,
      y: end.y,
      height
    },
    attrs: {
      width
    }
  });
});


registerAnimation('groupScaleInX', function(shape, animate, coord) {
  const { start, end } = coord;
  const width = Math.abs(end.x - start.x);
  const height = Math.abs(end.y - start.y);

  const type = 'y';
  const zeroY = coord.convertPoint({
    x: 0,
    y: 0
  });

  let x;
  let y;
  if (type === 'y') {
    x = start.x + width / 2;
    y = zeroY.y < start.y ? zeroY.y : start.y;
  } else if (type === 'x') {
    x = zeroY.x > start.x ? zeroY.x : start.x;
    y = start.y + height / 2;
  } else if (type === 'xy') {
    if (coord.isPolar) {
      x = coord.center.x;
      y = coord.center.y;
    } else {
      x = (start.x + end.x) / 2;
      y = (start.y + end.y) / 2;
    }
  }
  // debugger;
  const clip = createShape('Rect', {
    x: start.x,
    y: end.y,
    width,
    height
  });
  clip.attr({
    x: start.x,
    y: end.y,
    width,
    height
  });

  const endMatrix = getScaledMatrix(clip, [ x, y ], type);
  const startMatrix = [].concat(clip.getMatrix());

  clip.set('canvas', shape.get('canvas'));
  shape.attr('clip', clip);

  shape.animate({
    ...animate,
    clip,
    start: {
      x: start.x,
      y: end.y,
      width,
      height,
      matrix: startMatrix
    },
    attrs: {
      matrix: endMatrix
    }
  });
});

registerAnimation('shapeScaleInX', function(shape, animate, coord) {
  // const { start, end } = coord;
  // const width = Math.abs(end.x - start.x);
  // const height = Math.abs(end.y - start.y);

  const type = 'y';
  const box = shape.getBBox();
  // const x = (box.minX + box.maxX) / 2;
  // const y = (box.minY + box.maxY) / 2;
  const x = box.maxX;
  const y = box.maxY;

  const endMatrix = getScaledMatrix(shape, [ x, y ], type);
  const startMatrix = [].concat(shape.getMatrix());


  shape.animate({
    ...animate,
    start: {
      matrix: startMatrix
    },
    attrs: {
      matrix: endMatrix
    }
  });
});

registerAnimation('fadeIn', function(shape, animate) {
  shape.animate({
    ...animate,
    start: {
      fillOpacity: 0
    },
    attrs: {
      fillOpacity: 1
    }
  });
});

export {
  registerAnimation,
  getAnimation
};
