export class Loop {
  constructor(onTick) {
    this.onTick = onTick;
    this.running = false;
    this.paused = false;
    this.lastTime = 0;
    this.rafId = null;
    this.dt = 0;
    this.time = 0;
    this.fps = 0;
    this.frameCount = 0;
    this.fpsTimer = 0;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.tick(this.lastTime);
  }

  stop() {
    this.running = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  togglePause() {
    this.paused = !this.paused;
    if (!this.paused) {
      this.lastTime = performance.now();
    }
    return this.paused;
  }

  tick(now) {
    if (!this.running) return;
    this.rafId = requestAnimationFrame((t) => this.tick(t));

    if (this.paused) {
      this.lastTime = now;
      return;
    }

    this.dt = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;
    this.time += this.dt;
    this.frameCount++;

    this.fpsTimer += this.dt;
    if (this.fpsTimer >= 0.5) {
      this.fps = this.frameCount / this.fpsTimer;
      this.frameCount = 0;
      this.fpsTimer = 0;
    }

    this.onTick(this.dt);
  }
}
