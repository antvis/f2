
import Shape from '../shape';
import { getBBoxFromPoints, getBBoxFromBezierGroup } from '../util/bbox';
import * as Smooth from '../util/smooth';

// filter the point which x or y is NaN
function _filterPoints(points) {
  const filteredPoints = [];
  for (let i = 0, len = points.length; i < len; i++) {
    const point = points[i];
    if (!isNaN(point.x) && !isNaN(point.y)) {
      filteredPoints.push(point);
    }
  }

  return filteredPoints;
}

class Polyline extends Shape {
  _initProperties() {
    super._initProperties();
    this._attrs.canFill = true;
    this._attrs.canStroke = true;
    this._attrs.type = 'polyline';
  }

  getDefaultAttrs() {
    return {
      points: [],
      lineWidth: 1,
      smooth: false
    };
  }

  createPath(context) {
    const self = this;
    const attrs = self.get('attrs');
    const { points, smooth } = attrs;

    const filteredPoints = _filterPoints(points);

    context.beginPath();
    if (filteredPoints.length) {
      context.moveTo(filteredPoints[0].x, filteredPoints[0].y);
      if (smooth) {
        const constaint = [
          [ 0, 0 ],
          [ 1, 1 ]
        ];
        const sps = Smooth.smooth(filteredPoints, false, constaint);
        for (let i = 0, n = sps.length; i < n; i++) {
          const sp = sps[i];
          context.bezierCurveTo(sp[1], sp[2], sp[3], sp[4], sp[5], sp[6]);
        }
      } else {
        let i;
        let l;
        for (i = 1, l = filteredPoints.length - 1; i < l; i++) {
          context.lineTo(filteredPoints[i].x, filteredPoints[i].y);
        }
        context.lineTo(filteredPoints[l].x, filteredPoints[l].y);
      }
    }
  }

  calculateBox() {
    const attrs = this.get('attrs');
    const { points, smooth, lineWidth } = attrs;

    const filteredPoints = _filterPoints(points);
    if (smooth) {
      const newPoints = [];
      const constaint = [
        [ 0, 0 ],
        [ 1, 1 ]
      ];
      const sps = Smooth.smooth(filteredPoints, false, constaint);
      for (let i = 0, n = sps.length; i < n; i++) {
        const sp = sps[i];
        if (i === 0) {
          newPoints.push([ filteredPoints[0].x, filteredPoints[0].y, sp[1], sp[2], sp[3], sp[4], sp[5], sp[6] ]);
        } else {
          const lastPoint = sps[ i - 1 ];
          newPoints.push([ lastPoint[5], lastPoint[6], sp[1], sp[2], sp[3], sp[4], sp[5], sp[6] ]);
        }
      }
      return getBBoxFromBezierGroup(newPoints, lineWidth);
    }
    return getBBoxFromPoints(filteredPoints, lineWidth);
  }
}

Shape.Polyline = Polyline;
export default Polyline;
