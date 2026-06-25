export class Vec2 {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  set(x, y) {
    this.x = x;
    this.y = y;
    return this;
  }

  add(v) {
    this.x += v.x;
    this.y += v.y;
    return this;
  }

  sub(v) {
    this.x -= v.x;
    this.y -= v.y;
    return this;
  }

  scale(s) {
    this.x *= s;
    this.y *= s;
    return this;
  }

  mag() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  magSq() {
    return this.x * this.x + this.y * this.y;
  }

  normalize() {
    const m = this.mag();
    if (m > 0) this.scale(1 / m);
    return this;
  }

  limit(max) {
    const m = this.mag();
    if (m > max) this.scale(max / m);
    return this;
  }

  distTo(v) {
    const dx = this.x - v.x;
    const dy = this.y - v.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  angle() {
    return Math.atan2(this.y, this.x);
  }

  rotate(theta) {
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);
    const x = this.x * cos - this.y * sin;
    const y = this.x * sin + this.y * cos;
    this.x = x;
    this.y = y;
    return this;
  }

  copy() {
    return new Vec2(this.x, this.y);
  }

  static add(a, b) {
    return new Vec2(a.x + b.x, a.y + b.y);
  }

  static sub(a, b) {
    return new Vec2(a.x - b.x, a.y - b.y);
  }

  static scale(v, s) {
    return new Vec2(v.x * s, v.y * s);
  }

  static fromAngle(theta, len = 1) {
    return new Vec2(Math.cos(theta) * len, Math.sin(theta) * len);
  }
}
