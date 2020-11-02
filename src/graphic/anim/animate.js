import Timeline from './timeline';
import Composer from './composer';
// import composite from './composite';
// import { mix } from '../../util/common';

class Animate {
  timeline = null;

  constructor(canvas) {
    this.canvas = canvas;
    this.timeline = new Timeline();
    this.composer = new Composer(canvas);
  }

  play() {
    const { canvas, timeline, composer } = this;
    const root = composer.convert();
    const duration = composer.getTotalDuration(root);
    timeline.play(duration, time => {
      root.to(time);
      canvas._drawInner();
    }, () => {
      console.log('play end');
    });
  }

  pause() {
    this.timeline.pause();
  }

  stop() {
    this.timeline.stop();
  }
}

export default Animate;
