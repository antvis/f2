import { requestAnimationFrame } from '../util/requestAnimationFrame';
import Emit from '../event/emit';
const clock = typeof performance === 'object' && performance.now ? performance : Date;

class Timeline extends Emit {
  playing = false;
  // 暂停中
  paused = false;
  // 暂停的时间点
  pausedTime = 0;

  play(duration, onUpdate, onEnd) {
    if (this.playing) {
      return;
    }
    this.duration = duration;
    const {
      paused,
      pausedTime
    } = this;
    this.playing = true;
    this.onUpdate = onUpdate;
    let startTime = clock.now();

    // 如果当前正在暂停状态， 从暂停态继续播放
    if (paused && pausedTime) {
      startTime = startTime - pausedTime;
      this.paused = false;
      this.pausedTime = 0;
    }

    const play = () => {
      const now = clock.now();
      const time = now - startTime;
      if (time >= duration) {
        this.update(duration);
        onEnd();
        this.playing = false;
        return;
      }
      if (this.paused) {
        this.update(time);
        this.pausedTime = time;
        this.playing = false;
        return;
      }
      this.update(time);
      requestAnimationFrame(play);
    };
    requestAnimationFrame(play);
  }

  update(time) {
    this.onUpdate && this.onUpdate(time);
    this.emit('update', { time });
  }

  pause() {
    this.paused = true;
  }

  stop() {
    this.playing = false;
  }

}

export default Timeline;
