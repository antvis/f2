// 动画编排器

// import { mix } from '../../util/common';


// 每个动画的节点
class Node {
  element = null
  children = null;
  siblings = null;

  constructor(element, children) {
    this.element = element;
    this.children = children;
  }

  setSiblings(siblings) {
    this.siblings = siblings;
  }

  getTotalDuration() {
    const { element, children, siblings } = this;
    const { animate } = element._attrs;
    const { duration = 0, delay = 0 } = animate || {};

    let maxChildDuration = 0;
    if (children && children.length) {
      for (let i = 0, len = children.length; i < len; i++) {
        const child = children[i];
        maxChildDuration = Math.max(maxChildDuration, child.getTotalDuration());
      }
    }

    let maxSiblingDuration = 0;
    if (siblings && siblings.length) {
      for (let i = 0, len = siblings.length; i < len; i++) {
        const child = siblings[i];
        maxSiblingDuration = Math.max(maxSiblingDuration, child.getTotalDuration());
      }
    }
    return duration + delay + maxChildDuration + maxSiblingDuration;
  }

  to(time) {
    const { element, children, siblings } = this;
    const { animate } = element._attrs;
    if (animate) {
      element.animateTo(time);
    }
    const { duration = 0, delay = 0 } = animate || {};
    if (children && children.length) {
      for (let i = 0, len = children.length; i < len; i++) {
        const child = children[i];
        child.to(time - duration - delay);
      }
    }
    // TODO: 需要再children之后执行
    if (siblings && siblings.length) {
      for (let i = 0, len = siblings.length; i < len; i++) {
        const child = siblings[i];
        child.to(time - duration - delay);
      }
    }
  }
}

class Composer {
  canvas = null;

  constructor(canvas) {
    this.canvas = canvas;
  }

  createNode(element) {
    const children = this.compositeChildren(element.get('children'));
    const node = new Node(element, children);
    return node;
  }

  compositeChildren(children) {
    if (!children || !children.length) {
      return;
    }
    const result = [];
    let prevNode = this.createNode(children[0]);
    result.push(prevNode);
    let prevResult = result;
    for (let i = 1, len = children.length; i < len; i++) {
      const child = children[i];
      const node = this.createNode(child);
      const { animate } = child._attrs;
      const { type } = animate || {};
      if (type === 'sequential') {
        prevResult = [ node ];
        prevNode.setSiblings(prevResult);
      } else {
        prevResult.push(node);
      }
      prevNode = node;
    }
    return result;
  }

  // 生成动画树
  convert() {
    const { canvas } = this;
    return this.createNode(canvas);
  }

  getTotalDuration(root) {
    return root.getTotalDuration();
  }

}

export default Composer;
