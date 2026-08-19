/**
 * SimulationClock - Drives the virtual session time.
 * Supports fixed step physics integration (dt = 1/60s), variable speed scaling (0.25x - 50x),
 * play, pause, single-frame stepping, and timeline seeking.
 */
export class SimulationClock {
  constructor({ targetFps = 60, totalDurationSeconds = 1800 } = {}) {
    this.targetFps = targetFps;
    this.fixedDt = 1 / targetFps; // 16.67ms
    this.totalDuration = totalDurationSeconds; // Default 30 min race

    this.currentTime = 0;
    this.isPlaying = true;
    this.speedMultiplier = 1.0;

    this.listeners = new Set();
    this.lastRealTime = null;
    this.animationFrameId = null;
    this.intervalId = null;
  }

  start() {
    if (this.animationFrameId || this.intervalId) return;

    this.lastRealTime = performance.now();

    const loop = (now) => {
      if (!this.lastRealTime) this.lastRealTime = now;
      const realDt = (now - this.lastRealTime) / 1000;
      this.lastRealTime = now;

      if (this.isPlaying) {
        // Apply speed multiplier to real delta
        const simDelta = Math.min(realDt, 0.1) * this.speedMultiplier;
        this.step(simDelta);
      }

      this.animationFrameId = requestAnimationFrame(loop);
    };

    if (typeof requestAnimationFrame !== 'undefined') {
      this.animationFrameId = requestAnimationFrame(loop);
    } else {
      this.intervalId = setInterval(() => {
        if (this.isPlaying) {
          this.step(this.fixedDt * this.speedMultiplier);
        }
      }, 1000 / this.targetFps);
    }
  }

  stop() {
    if (this.animationFrameId && typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.lastRealTime = null;
  }

  play() {
    this.isPlaying = true;
    this.notify();
  }

  pause() {
    this.isPlaying = false;
    this.notify();
  }

  togglePlay() {
    this.isPlaying = !this.isPlaying;
    this.notify();
  }

  setSpeed(multiplier) {
    this.speedMultiplier = Math.max(0.1, Math.min(50.0, multiplier));
    this.notify();
  }

  seek(targetTimeSeconds) {
    this.currentTime = Math.max(0, Math.min(this.totalDuration, targetTimeSeconds));
    this.notify();
  }

  seekPercent(pct) {
    const clamped = Math.max(0, Math.min(1, pct));
    this.seek(clamped * this.totalDuration);
  }

  stepForward(frames = 1) {
    this.pause();
    this.step(this.fixedDt * frames);
  }

  stepBackward(frames = 1) {
    this.pause();
    this.currentTime = Math.max(0, this.currentTime - (this.fixedDt * frames));
    this.notify();
  }

  step(simDeltaSeconds) {
    this.currentTime += simDeltaSeconds;
    if (this.currentTime >= this.totalDuration) {
      this.currentTime = this.totalDuration;
      this.isPlaying = false;
    }
    this.notify(simDeltaSeconds);
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify(delta = 0) {
    for (const listener of this.listeners) {
      try {
        listener({
          currentTime: this.currentTime,
          totalDuration: this.totalDuration,
          progress: this.totalDuration > 0 ? this.currentTime / this.totalDuration : 0,
          isPlaying: this.isPlaying,
          speedMultiplier: this.speedMultiplier,
          delta
        });
      } catch (err) {
        console.error('SimulationClock listener error:', err);
      }
    }
  }

  reset() {
    this.currentTime = 0;
    this.notify();
  }
}
