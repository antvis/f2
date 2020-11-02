import { mix } from '../../util/common';
// 并行
function toParallel(children, cache) {
  return children.map(child => {
    return composite(child, cache);
  });
}

// 串行
function toSerial(children, cache) {
  const element = composite(children[0], cache);
  let prev = element;
  for (let i = 1, len = children.length; i < len; i++) {
    const child = children[i];
    const element = composite(child, cache);
    prev.children = [ element ];
    prev = element;
  }
  return [ element ];
}

function convert(shape, cache) {
  const { id } = shape;
  let animateType;
  if (!Object.keys(cache).length) {
    animateType = 'appear';
  } else if (!cache[id]) { // 说明是change后新增的
    animateType = 'enter';
  } else {
    animateType = 'update';
    // 去掉有更新的之后，剩下的就是删除的shape
    delete cache[id];
  }
  const animateCfg = shape.get('animate') || {};
  const animate = animateCfg[animateType];
  if (animate) {
    const cacheShape = cache[id] || {};
    const startAttrs = cacheShape.attrs || (shape.getDefaultAttrs && shape.getDefaultAttrs());
    const endAttrs = mix({}, shape.get('attrs'));
    shape.attr && shape.attr(startAttrs);
    shape.set('startAttrs', startAttrs);
    shape.set('endAttrs', endAttrs);
    shape.set('animateType', animateType);
    // console.log(startAttrs, endAttrs);
  }

  return {
    shape,
    // eslint-disable-next-line object-shorthand
    update: function(time) {
      const { duration = 0, delay = 0 } = animate || {};
      shape.to && shape.to(time);
      const { children } = this;
      if (children && children.length) {
        for (let i = 0, len = children.length; i < len; i++) {
          const child = children[i];
          child.update(time - duration - delay);
        }
      }
    }
  };
}

function composer(children, cache) {
  const result = [];
  let prev = composite(children[0], cache);
  result.push(prev);
  let prevResult = result;
  for (let i = 1, len = children.length; i < len; i++) {
    const child = children[i];
    const element = composite(child, cache);
    const animateCfg = child.get('animate') || {};
    const animateType = child.get('animateType');
    const { type } = animateCfg[animateType] || {};
    if (type === 'sequential') {
      prevResult = [ element ];
      prev.children = prevResult;
    } else {
      prevResult.push(element);
    }
    prev = element;
  }
  return result;
}

function composite(shape, cache) {
  const element = convert(shape, cache);
  const shapeChildren = shape.get('children');
  if (shapeChildren && shapeChildren.length) {
    element.children = composer(shapeChildren, cache);
  }
  return element;
}

function getDuration(node) {
  const { children, shape } = node;
  const animateCfg = shape.get('animate') || {};
  const animateType = shape.get('animateType');
  const { duration = 0, delay = 0 } = animateCfg[animateType] || {};
  let maxChildDuration = 0;
  if (children && children.length) {
    for (let i = 0, len = children.length; i < len; i++) {
      const child = children[i];
      maxChildDuration = Math.max(maxChildDuration, getDuration(child));
    }
  }

  return delay + duration + maxChildDuration;
}

export default (root, cache) => {
  const node = composite(root, cache);
  const duration = getDuration(node);
  return { node, duration };
};
