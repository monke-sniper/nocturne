import { Vec2 } from '../engine/vector.js';
import { Mind } from '../brain/mind.js';
import { Drive } from '../brain/drive.js';
import { Action } from '../brain/action.js';
import { PERSONALITIES, randomPersonality } from '../brain/personality.js';
import { drawGlow, hsl, rgba } from '../lib/color.js';

const BALL_COLORS = [
  [0, 200, 255],
  [255, 50, 100],
  [57, 255, 20],
  [255, 170, 0],
  [200, 100, 255],
  [255, 0, 170],
  [0, 240, 200],
  [255, 200, 100],
];

export class CircleBounce {
  constructor() {
    this.balls = [];
    this.width = 800;
    this.height = 600;
    this.centerX = 400;
    this.centerY = 300;
    this.boundaryRadius = 250;
    this.name = 'Sentient Circle Bounce';
    this.description = 'Bouncing balls with internal drives that shape their trajectory. Each ball has a unique personality that evolves its bounce patterns.';
    this.instructions = 'Left click: spawn a new ball • R: reset';
  }

  getControls() {
    return `
      <label>Balls: <span id="cbCount">5</span></label>
      <input type="range" id="cbCountSlider" min="1" max="15" value="5" step="1">
      <label>Boundary Radius</label>
      <input type="range" id="cbRadius" min="100" max="350" value="250" step="10">
      <label>Speed</label>
      <input type="range" id="cbSpeed" min="0.1" max="3" value="1" step="0.1">
    `;
  }

  init(width, height) {
    this.width = width;
    this.height = height;
    this.centerX = width / 2;
    this.centerY = height / 2;
    this.balls = [];

    for (let i = 0; i < 5; i++) {
      this._spawnBall(i);
    }
  }

  _spawnBall(index) {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * this.boundaryRadius * 0.5;
    const personality = randomPersonality();
    const speed = 80 + Math.random() * 120;

    const drives = [
      new Drive('speed-preference', { initial: 50, decay: 1.5, max: 100 }),
      new Drive('boundary-attraction', { initial: 50, decay: 2.0, max: 100 }),
      new Drive('spin-desire', { initial: 50, decay: 1.0, max: 100 }),
      new Drive('curiosity', { initial: 30, decay: 0.8, max: 100 }),
    ];

    const actions = [
      new Action('speed-up', {
        effects: { 'speed-preference': -30 },
        perform: () => {},
      }),
      new Action('slow-down', {
        effects: { 'speed-preference': 20 },
        perform: () => {},
      }),
      new Action('hug-edge', {
        effects: { 'boundary-attraction': -25, curiosity: 10 },
        perform: () => {},
      }),
      new Action('cut-across', {
        effects: { 'boundary-attraction': 20, curiosity: -25 },
        perform: () => {},
      }),
      new Action('spiral', {
        effects: { 'spin-desire': -30, curiosity: -15 },
        perform: () => {},
      }),
    ];

    const ball = {
      x: this.centerX + Math.cos(angle) * dist,
      y: this.centerY + Math.sin(angle) * dist,
      vx: Math.cos(angle + Math.PI / 2) * speed,
      vy: Math.sin(angle + Math.PI / 2) * speed,
      radius: 6 + Math.random() * 4,
      mind: new Mind(drives, actions, personality.weights),
      personality,
      color: BALL_COLORS[index % BALL_COLORS.length],
      trail: [],
      age: 0,
    };

    if (index === undefined) {
      this.balls.push(ball);
    }
    return ball;
  }

  update(dt) {
    for (let i = 0; i < this.balls.length; i++) {
      const b = this.balls[i];
      b.age += dt;

      b.mind.tick(dt * 4);

      const desiredSpeed = 80 + b.mind.getDriveUrgency('speed-preference') * 200;
      const edgePull = (b.mind.getDriveUrgency('boundary-attraction') - 0.5) * 2;
      const spin = (b.mind.getDriveUrgency('spin-desire') - 0.5) * 2;

      const dx = b.x - this.centerX;
      const dy = b.y - this.centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 0) {
        const nx = dx / dist;
        const ny = dy / dist;

        const tangentX = -ny;
        const tangentY = nx;

        b.vx -= nx * edgePull * 100 * dt;
        b.vy -= ny * edgePull * 100 * dt;

        b.vx += tangentX * spin * 30 * dt;
        b.vy += tangentY * spin * 30 * dt;
      }

      const currentSpeed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
      if (currentSpeed > 0) {
        const speedDiff = desiredSpeed - currentSpeed;
        b.vx += (b.vx / currentSpeed) * speedDiff * 0.5 * dt;
        b.vy += (b.vy / currentSpeed) * speedDiff * 0.5 * dt;
      }

      b.x += b.vx * dt;
      b.y += b.vy * dt;

      const newDist = Math.sqrt(
        (b.x - this.centerX) ** 2 + (b.y - this.centerY) ** 2
      );
      if (newDist > this.boundaryRadius - b.radius) {
        const nx = (b.x - this.centerX) / newDist;
        const ny = (b.y - this.centerY) / newDist;
        b.x = this.centerX + nx * (this.boundaryRadius - b.radius);
        b.y = this.centerY + ny * (this.boundaryRadius - b.radius);
        const dot = b.vx * nx + b.vy * ny;
        b.vx -= 2 * dot * nx;
        b.vy -= 2 * dot * ny;
        b.vx *= 0.99;
        b.vy *= 0.99;
      }

      b.trail.push({ x: b.x, y: b.y });
      if (b.trail.length > 40) b.trail.shift();
    }
  }

  render(ctx) {
    ctx.clearRect(0, 0, this.width, this.height);

    ctx.strokeStyle = 'rgba(100, 100, 180, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY, this.boundaryRadius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(100, 100, 180, 0.05)';
    ctx.lineWidth = 1;
    for (let r = 0.4; r <= 1; r += 0.2) {
      ctx.beginPath();
      ctx.arc(this.centerX, this.centerY, this.boundaryRadius * r, 0, Math.PI * 2);
      ctx.stroke();
    }

    for (let i = 0; i < this.balls.length; i++) {
      const b = this.balls[i];
      const [r, g, bl] = b.color;

      for (let j = 0; j < b.trail.length; j++) {
        const t = j / b.trail.length;
        ctx.fillStyle = `rgba(${r},${g},${bl},${t * 0.3})`;
        ctx.beginPath();
        ctx.arc(b.trail[j].x, b.trail[j].y, 2 * t, 0, Math.PI * 2);
        ctx.fill();
      }

      drawGlow(ctx, b.x, b.y, b.radius * 4, [r, g, bl], 0.3);
      ctx.fillStyle = `rgb(${r},${g},${bl})`;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();

      const pulseR = b.radius + Math.sin(b.age * 3 + i) * 2;
      ctx.strokeStyle = `rgba(${r},${g},${bl},0.4)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(b.x, b.y, pulseR + 3, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  destroy() {
    this.balls = [];
  }

  handleClick(x, y) {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.sqrt(
      (x - this.centerX) ** 2 + (y - this.centerY) ** 2
    );
    if (dist < this.boundaryRadius - 10) {
      const speed = 80 + Math.random() * 120;
      const ball = {
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 6 + Math.random() * 4,
        mind: new Mind(
          [
            new Drive('speed-preference', { initial: 50, decay: 1.5, max: 100 }),
            new Drive('boundary-attraction', { initial: 50, decay: 2.0, max: 100 }),
            new Drive('spin-desire', { initial: 50, decay: 1.0, max: 100 }),
            new Drive('curiosity', { initial: 30, decay: 0.8, max: 100 }),
          ],
          [
            new Action('speed-up', { effects: { 'speed-preference': -30 }, perform: () => {} }),
            new Action('slow-down', { effects: { 'speed-preference': 20 }, perform: () => {} }),
            new Action('hug-edge', { effects: { 'boundary-attraction': -25, curiosity: 10 }, perform: () => {} }),
            new Action('cut-across', { effects: { 'boundary-attraction': 20, curiosity: -25 }, perform: () => {} }),
            new Action('spiral', { effects: { 'spin-desire': -30, curiosity: -15 }, perform: () => {} }),
          ],
          randomPersonality().weights
        ),
        personality: randomPersonality(),
        color: BALL_COLORS[this.balls.length % BALL_COLORS.length],
        trail: [],
        age: 0,
      };
      this.balls.push(ball);
    }
  }

  reset() {
    this.init(this.width, this.height);
  }

  bindControls() {
    const slider = document.getElementById('cbCountSlider');
    if (!slider) return;
    const countSpan = document.getElementById('cbCount');
    slider.addEventListener('input', () => {
      countSpan.textContent = slider.value;
      const target = parseInt(slider.value);
      while (this.balls.length < target) {
        const i = this.balls.length;
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * this.boundaryRadius * 0.5;
        const speed = 80 + Math.random() * 120;
        const ball = {
          x: this.centerX + Math.cos(angle) * dist,
          y: this.centerY + Math.sin(angle) * dist,
          vx: Math.cos(angle + Math.PI / 2) * speed,
          vy: Math.sin(angle + Math.PI / 2) * speed,
          radius: 6 + Math.random() * 4,
          mind: null,
          personality: randomPersonality(),
          color: BALL_COLORS[i % BALL_COLORS.length],
          trail: [],
          age: 0,
        };
        const drives = [
          new Drive('speed-preference', { initial: 50, decay: 1.5, max: 100 }),
          new Drive('boundary-attraction', { initial: 50, decay: 2.0, max: 100 }),
          new Drive('spin-desire', { initial: 50, decay: 1.0, max: 100 }),
          new Drive('curiosity', { initial: 30, decay: 0.8, max: 100 }),
        ];
        const actions = [
          new Action('speed-up', { effects: { 'speed-preference': -30 }, perform: () => {} }),
          new Action('slow-down', { effects: { 'speed-preference': 20 }, perform: () => {} }),
          new Action('hug-edge', { effects: { 'boundary-attraction': -25, curiosity: 10 }, perform: () => {} }),
          new Action('cut-across', { effects: { 'boundary-attraction': 20, curiosity: -25 }, perform: () => {} }),
          new Action('spiral', { effects: { 'spin-desire': -30, curiosity: -15 }, perform: () => {} }),
        ];
        ball.mind = new Mind(drives, actions, ball.personality.weights);
        this.balls.push(ball);
      }
      while (this.balls.length > target) {
        this.balls.pop();
      }
    });

    const radiusSlider = document.getElementById('cbRadius');
    if (radiusSlider) {
      radiusSlider.addEventListener('input', () => {
        this.boundaryRadius = parseInt(radiusSlider.value);
      });
    }
  }
}
