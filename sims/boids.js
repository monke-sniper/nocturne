import { Vec2 } from '../engine/vector.js';
import { SpatialGrid } from '../lib/spatial-grid.js';
import { Mind } from '../brain/mind.js';
import { Drive } from '../brain/drive.js';
import { Action } from '../brain/action.js';
import { PERSONALITIES, randomPersonality } from '../brain/personality.js';
import { drawGlow, hsl, getPaletteColor } from '../lib/color.js';

const PALETTE_BOID = [0, 200, 255];
const PALETTE_PREDATOR = [255, 50, 80];

export class SentientBoids {
  constructor() {
    this.boids = [];
    this.predators = [];
    this.foodSources = [];
    this.width = 800;
    this.height = 600;
    this.grid = new SpatialGrid(80);
    this.neighbors = [];
    this.mouse = { x: -100, y: -100 };
    this.name = 'Sentient Boids';
    this.description = 'Boids with moods, personalities, and drive-influenced flocking. Click to attract, right-click to repel.';
    this.instructions = 'Left click: attract boids • Right click: repel boids • R: reset';
  }

  getControls() {
    return `
      <label>Boids: <span id="boidCount">200</span></label>
      <input type="range" id="boidCountSlider" min="50" max="500" value="200" step="10">
      <label>Predator Radius</label>
      <input type="range" id="predatorRadius" min="50" max="300" value="150" step="10">
      <label>Speed</label>
      <input type="range" id="speedMult" min="0.1" max="3" value="1" step="0.1">
    `;
  }

  init(width, height) {
    this.width = width;
    this.height = height;
    this.boids = [];
    this.predators = [];
    this.foodSources = [];

    for (let i = 0; i < 200; i++) {
      this.boids.push(this._createBoid(
        Math.random() * width,
        Math.random() * height
      ));
    }
  }

  _createBoid(x, y, personalityKey) {
    const personality = personalityKey
      ? { key: personalityKey, ...PERSONALITIES[personalityKey] }
      : randomPersonality();

    const traits = personalityKey || personality.key;

    const drives = [
      new Drive('separation', { initial: 20, decay: 0.5, max: 100 }),
      new Drive('cohesion', { initial: 60, decay: 1.5, max: 100 }),
      new Drive('alignment', { initial: 50, decay: 1.0, max: 100 }),
      new Drive('speed-desire', { initial: 50, decay: 0.8, max: 100 }),
      new Drive('curiosity', { initial: 30, decay: 1.2, max: 100 }),
    ];

    const actions = [
      new Action('spread-out', {
        effects: { separation: -40, cohesion: 10, alignment: 5 },
        perform: () => {},
      }),
      new Action('cluster', {
        effects: { separation: 15, cohesion: -35, alignment: -10 },
        perform: () => {},
      }),
      new Action('match-flow', {
        effects: { separation: 5, cohesion: 5, alignment: -30 },
        perform: () => {},
      }),
      new Action('surge', {
        effects: { 'speed-desire': -25, separation: 5 },
        perform: () => {},
      }),
      new Action('explore', {
        effects: { curiosity: -30, separation: 10, cohesion: 10 },
        perform: () => {},
      }),
    ];

    const mind = new Mind(drives, actions, personality.weights);

    return {
      x, y,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      age: 0,
      mind,
      personality,
      size: 4 + Math.random() * 2,
      color: null,
    };
  }

  _updateBoid(boid, dt) {
    boid.age += dt;

    boid.mind.tick(dt * 3);

    const sepW = 2.5 * (1 + boid.mind.getDriveUrgency('separation'));
    const cohW = 1.5 * (1 + boid.mind.getDriveUrgency('cohesion'));
    const aliW = 1.0 * (1 + boid.mind.getDriveUrgency('alignment'));
    const speedDesire = 2 + boid.mind.getDriveUrgency('speed-desire') * 4;
    const maxSpeed = 2 + boid.mind.getDriveUrgency('curiosity') * 2;

    const sep = new Vec2();
    const coh = new Vec2();
    const ali = new Vec2();
    const predFlee = new Vec2();
    const foodAttract = new Vec2();
    let count = 0;

    this.grid.query(boid.x, boid.y, 70, this.neighbors);

    for (let i = 0; i < this.neighbors.length; i++) {
      const other = this.neighbors[i];
      if (other === boid) continue;
      const dx = boid.x - other.x;
      const dy = boid.y - other.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < 1) continue;

      if (d < 25) {
        sep.x += dx / d;
        sep.y += dy / d;
      }

      coh.x += other.x;
      coh.y += other.y;
      ali.x += other.vx;
      ali.y += other.vy;
      count++;
    }

    for (let i = 0; i < this.predators.length; i++) {
      const p = this.predators[i];
      const dx = boid.x - p.x;
      const dy = boid.y - p.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < p.radius && d > 0) {
        predFlee.x += (dx / d) * p.strength * (1 - d / p.radius);
        predFlee.y += (dy / d) * p.strength * (1 - d / p.radius);
        boid.mind.drives[0].value += 30 * dt;
      }
    }

    for (let i = 0; i < this.foodSources.length; i++) {
      const f = this.foodSources[i];
      const dx = f.x - boid.x;
      const dy = f.y - boid.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < f.radius && d > 0) {
        foodAttract.x += (dx / d) * 3 * (1 - d / f.radius);
        foodAttract.y += (dy / d) * 3 * (1 - d / f.radius);
      }
    }

    const force = new Vec2();
    if (count > 0) {
      coh.x /= count;
      coh.y /= count;
      const cohDx = coh.x - boid.x;
      const cohDy = coh.y - boid.y;
      const cohD = Math.sqrt(cohDx * cohDx + cohDy * cohDy);
      if (cohD > 0) {
        force.x += (cohDx / cohD) * cohW;
        force.y += (cohDy / cohD) * cohW;
      }

      ali.x /= count;
      ali.y /= count;
      force.x += (ali.x - boid.vx) * aliW;
      force.y += (ali.y - boid.vy) * aliW;
    }

    const sepM = sep.mag();
    if (sepM > 0) {
      force.x += (sep.x / sepM) * sepW;
      force.y += (sep.y / sepM) * sepW;
    }

    force.x += predFlee.x * 5;
    force.y += predFlee.y * 5;

    force.x += foodAttract.x;
    force.y += foodAttract.y;

    const forceM = force.mag();
    if (forceM > 0.5) {
      force.normalize().scale(0.5);
    }

    boid.vx += force.x * dt * 60;
    boid.vy += force.y * dt * 60;
    const speed = Math.sqrt(boid.vx * boid.vx + boid.vy * boid.vy);
    if (speed > maxSpeed) {
      boid.vx = (boid.vx / speed) * maxSpeed;
      boid.vy = (boid.vy / speed) * maxSpeed;
    }
    if (speed < speedDesire * 0.3 && speed > 0) {
      boid.vx = (boid.vx / speed) * speedDesire * 0.3;
      boid.vy = (boid.vy / speed) * speedDesire * 0.3;
    }

    boid.x += boid.vx * dt * 60;
    boid.y += boid.vy * dt * 60;
    boid.x = ((boid.x % this.width) + this.width) % this.width;
    boid.y = ((boid.y % this.height) + this.height) % this.height;

    const speedNorm = speed / maxSpeed;
    const sepU = boid.mind.getDriveUrgency('separation');
    boid.color = [
      Math.round(50 + speedNorm * 200),
      Math.round(100 + (1 - sepU) * 155),
      Math.round(150 + sepU * 105),
    ];
  }

  update(dt) {
    this.grid.clear();
    for (let i = 0; i < this.boids.length; i++) {
      this.grid.insert(this.boids[i]);
    }

    for (let i = 0; i < this.boids.length; i++) {
      this._updateBoid(this.boids[i], dt);
    }

    const speedMult = parseFloat(document.getElementById('speedMult')?.value ?? 1);
    if (speedMult !== 1) {
      for (const b of this.boids) {
        b.vx *= speedMult * 0.99 + 0.99;
        b.vy *= speedMult * 0.99 + 0.99;
      }
    }
  }

  render(ctx) {
    ctx.clearRect(0, 0, this.width, this.height);

    ctx.fillStyle = 'rgba(10, 10, 18, 0.15)';
    ctx.fillRect(0, 0, this.width, this.height);

    for (let i = 0; i < this.foodSources.length; i++) {
      const f = this.foodSources[i];
      f.life -= 0.005;
      if (f.life <= 0) continue;
      drawGlow(ctx, f.x, f.y, f.radius * 0.8, [57, 255, 20], f.life);
      ctx.fillStyle = `rgba(57, 255, 20, ${f.life * 0.6})`;
      ctx.beginPath();
      ctx.arc(f.x, f.y, 3 + f.life, 0, Math.PI * 2);
      ctx.fill();
    }
    this.foodSources = this.foodSources.filter((f) => f.life > 0);

    for (let i = 0; i < this.predators.length; i++) {
      const p = this.predators[i];
      drawGlow(ctx, p.x, p.y, p.radius, [255, 50, 80], 0.6);
      ctx.strokeStyle = `rgba(255, 50, 80, ${0.3 + Math.sin(performance.now() * 0.003 + i) * 0.1})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255, 50, 80, 0.9)';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    for (let i = 0; i < this.boids.length; i++) {
      const b = this.boids[i];
      const angle = Math.atan2(b.vy, b.vx);
      const [r, g, bl] = b.color;
      drawGlow(ctx, b.x, b.y, 15, [r, g, bl], 0.3);

      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(angle);
      const size = b.size;
      ctx.fillStyle = `rgb(${r},${g},${bl})`;
      ctx.beginPath();
      ctx.moveTo(size * 2, 0);
      ctx.lineTo(-size, -size * 0.6);
      ctx.lineTo(-size, size * 0.6);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  destroy() {
    this.boids = [];
    this.predators = [];
    this.foodSources = [];
  }

  handleClick(x, y, button) {
    if (button === 0) {
      this.foodSources.push({ x, y, radius: 80, life: 1, strength: 3 });
    } else if (button === 2) {
      this.predators.push({ x, y, radius: 150, strength: 8, life: 3 });
    }
  }

  handleMove(x, y) {
    this.mouse.x = x;
    this.mouse.y = y;
  }

  reset() {
    this.init(this.width, this.height);
  }

  bindControls() {
    const slider = document.getElementById('boidCountSlider');
    if (!slider) return;
    const countSpan = document.getElementById('boidCount');
    slider.addEventListener('input', () => {
      countSpan.textContent = slider.value;
      const current = this.boids.length;
      const target = parseInt(slider.value);
      if (target > current) {
        for (let i = current; i < target; i++) {
          this.boids.push(this._createBoid(
            Math.random() * this.width,
            Math.random() * this.height
          ));
        }
      } else if (target < current) {
        this.boids.length = target;
      }
    });
  }
}
