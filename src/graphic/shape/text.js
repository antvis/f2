import { isNil, measureText, isString } from '../../util/common';
import Shape from '../shape';
import RectUtil from '../util/rect';

let textWidthCacheCounter = 0;
let textWidthCache = {};
const TEXT_CACHE_MAX = 5000;

class Text extends Shape {
  _initProperties() {
    super._initProperties();
    this._attrs.canFill = true;
    this._attrs.canStroke = true;
    this._attrs.type = 'text';
  }

  getDefaultAttrs() {
    return {
      lineWidth: 0,
      lineCount: 1,
      fontSize: 12,
      fontFamily: 'sans-serif',
      fontStyle: 'normal',
      fontWeight: 'normal',
      fontVariant: 'normal',
      textAlign: 'start',
      textBaseline: 'bottom',
      lineHeight: null,
      textArr: null
    };
  }

  _getFontStyle() {
    const attrs = this._attrs.attrs;
    const { fontSize, fontFamily, fontWeight, fontStyle, fontVariant } = attrs;
    return `${fontStyle} ${fontVariant} ${fontWeight} ${fontSize}px ${fontFamily}`;
  }

  _afterAttrsSet() {
    const attrs = this._attrs.attrs;
    attrs.font = this._getFontStyle();

    if (attrs.text) {
      const text = attrs.text;
      let textArr = null;
      let lineCount = 1;
      if (isString(text) && (text.indexOf('\n') !== -1)) {
        textArr = text.split('\n');
        lineCount = textArr.length;
      }
      attrs.lineCount = lineCount;
      attrs.textArr = textArr;
    }
    this.set('attrs', attrs);
  }

  _getTextHeight() {
    const attrs = this._attrs.attrs;
    if (attrs.height) {
      return attrs.height;
    }
    const lineCount = attrs.lineCount;
    const fontSize = attrs.fontSize * 1;
    if (lineCount > 1) {
      const spaceingY = this._getSpaceingY();
      return fontSize * lineCount + spaceingY * (lineCount - 1);
    }
    return fontSize;
  }

  _getSpaceingY() {
    const attrs = this._attrs.attrs;
    const lineHeight = attrs.lineHeight;
    const fontSize = attrs.fontSize * 1;
    return lineHeight ? (lineHeight - fontSize) : fontSize * 0.14;
  }

  drawInner(context) {
    const self = this;
    const attrs = self._attrs.attrs;
    const text = attrs.text;
    let x = attrs.x;
    let y = attrs.y;
    if (isNil(text) || isNaN(x) || isNaN(y)) { // text will be 0
      return;
    }
    const textArr = attrs.textArr;
    const fontSize = attrs.fontSize * 1;
    const spaceingY = self._getSpaceingY();

    if (attrs.rotate) { // do rotation
      context.translate(x, y);
      context.rotate(attrs.rotate);
      x = 0;
      y = 0;
    }

    const textBaseline = attrs.textBaseline;
    let height;
    if (textArr) {
      height = self._getTextHeight();
    }
    let subY;
    
    // 先描边
    if (self.hasStroke()) {
      if (textArr) {
        for (let i = 0, len = textArr.length; i < len; i++) {
          const subText = textArr[i];
          subY = y + i * (spaceingY + fontSize) - height + fontSize; // bottom;
          if (textBaseline === 'middle') {
            subY += height - fontSize - (height - fontSize) / 2;
          }
          if (textBaseline === 'top') {
            subY += height - fontSize;
          }
          context.strokeText(subText, x, subY);
        }
      } else {
        context.strokeText(text, x, y);
      }
    }

    // 后填充
    // context.beginPath();
    if (self.hasFill()) {
      const fillOpacity = attrs.fillOpacity;
      if (!isNil(fillOpacity) && fillOpacity !== 1) {
        context.globalAlpha = fillOpacity;
      }
      if (textArr) {
        for (let i = 0, len = textArr.length; i < len; i++) {
          const subText = textArr[i];
          subY = y + i * (spaceingY + fontSize) - height + fontSize; // bottom;
          if (textBaseline === 'middle') {
            subY += height - fontSize - (height - fontSize) / 2;
          }
          if (textBaseline === 'top') {
            subY += height - fontSize;
          }
          context.fillText(subText, x, subY);
        }
      } else {
        context.fillText(text, x, y);
      }
    }

    
  }

  _getAriaLabel() {
    return this._attrs.attrs.text;
  }

  calculateBox() {
    const self = this;
    const attrs = self._attrs.attrs;
    const { x, y, textAlign, textBaseline } = attrs;
    let width = self._getTextWidth(); // attrs.width
    if (!width) {
      return {
        minX: x,
        minY: y,
        maxX: x,
        maxY: y
      };
    }
    let height = self._getTextHeight(); // attrs.height

    if (attrs.rotate) {
      const rotatedBox = RectUtil.calcRotatedBox({
        width,
        height,
        rotate: attrs.rotate
      });
      width = rotatedBox.width;
      height = rotatedBox.height;
    }
    const point = {
      x,
      y: y - height
    }; // default textAlign: start, textBaseline: bottom

    if (textAlign) {
      if (textAlign === 'end' || textAlign === 'right') {
        point.x -= width;
      } else if (textAlign === 'center') {
        point.x -= width / 2;
      }
    }

    if (textBaseline) {
      if (textBaseline === 'top') {
        point.y += height;
      } else if (textBaseline === 'middle') {
        point.y += height / 2;
      }
    }

    return {
      minX: point.x,
      minY: point.y,
      maxX: point.x + width,
      maxY: point.y + height
    };
  }

  _getTextWidth() {
    const attrs = this._attrs.attrs;
    if (attrs.width) {
      return attrs.width;
    }
    const text = attrs.text;
    const context = this.get('context');

    if (isNil(text)) return undefined;

    const font = attrs.font;
    const textArr = attrs.textArr;
    const key = text + '' + font;
    if (textWidthCache[key]) {
      return textWidthCache[key];
    }

    let width = 0;
    if (textArr) {
      for (let i = 0, length = textArr.length; i < length; i++) {
        const subText = textArr[i];
        width = Math.max(width, measureText(subText, font, context).width);
      }
    } else {
      width = measureText(text, font, context).width;
    }

    if (textWidthCacheCounter > TEXT_CACHE_MAX) {
      textWidthCacheCounter = 0;
      textWidthCache = {};
    }
    textWidthCacheCounter++;
    textWidthCache[key] = width;

    return width;
  }
}

Shape.Text = Text;

export default Text;
