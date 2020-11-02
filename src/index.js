/**
 * Default, without interactins
 */

import { Global, Chart, Shape, G, Util, Helper, track } from './core';

import './geom/';
import './geom/adjust/';

import './coord/polar'; // polar coordinate
import './component/axis/circle'; // the axis for polar coordinate

import './component/guide/arc';
import './component/guide/html';
import './component/guide/line';
import './component/guide/rect';
import './component/guide/text';
import './component/guide/tag';
import './component/guide/point';

import Marker from './component/marker';
import * as Tooltip from './plugin/tooltip';
import * as Guide from './plugin/guide';
import * as Legend from './plugin/legend';

const Component = {
  Marker
};

// register plugins
Chart.plugins.register([ Tooltip, Legend, Guide ]);

// 默认添加交互
import './interaction/new/index';

export {
  Component,
  Global,
  Chart,
  Shape,
  G,
  Util,
  Helper,
  track
};

export default {
  Component,
  Global,
  Chart,
  Shape,
  G,
  Util,
  Helper,
  track
};

