export class Drive {
  constructor(name, config = {}) {
    this.name = name;
    this.value = config.initial ?? 0;
    this.min = config.min ?? 0;
    this.max = config.max ?? 100;
    this.decay = config.decay ?? 2;
    this.weight = config.weight ?? 1;
  }

  tick(dt) {
    this.value += this.decay * dt;
    this.value = Math.max(this.min, Math.min(this.max, this.value));
  }

  urgency() {
    return (this.value - this.min) / (this.max - this.min);
  }

  modify(delta) {
    this.value = Math.max(this.min, Math.min(this.max, this.value + delta));
  }

  reset() {
    this.value = 0;
  }
}
