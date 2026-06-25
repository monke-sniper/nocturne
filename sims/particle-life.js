import { drawGlow, hsl, rgba, getPaletteColor } from '../lib/color.js';

const PRESETS = {
  cells: {
    name: 'Cells',
    matrix: [
      [-0.32, -0.17, 0.34, 0, 0],
      [-0.34, -0.10, 0, 0, 0],
      [0, 0, 0.15, -0.20, 0],
      [0, 0, 0, -0.15, 0.10],
      [0.10, -0.10, 0, 0, -0.05],
    ],
    colors: [
      [57, 255, 20],
      [0, 200, 255],
      [255, 170, 0],
      [255, 0, 170],
      [170, 50, 255],
    ],
  },
  galaxies: {
    name: 'Galaxies',
    matrix: [
      [0.15, 0.10, -0.05, 0, 0],
      [-0.05, 0.15, 0.10, 0, 0],
      [0.10, -0.05, 0.15, 0, 0],
      [0, 0, 0, 0.10, -0.05],
      [0, 0, 0, 0.05, 0.10],
    ],
    colors: [
      [255, 150, 50],
      [255, 200, 100],
      [200, 100, 255],
      [100, 150, 255],
      [50, 200, 255],
    ],
  },
  predators: {
    name: 'Predators',
    matrix: [
      [-0.15, -0.30, 0, 0.25, 0],
      [0.30, -0.15, -0.25, 0, 0],
      [0, 0.25, -0.15, -0.30, 0],
      [-0.25, 0, 0.30, -0.15, 0],
      [0, 0, 0, 0, -0.10],
    ],
    colors: [
      [255, 50, 80],
      [0, 240, 255],
      [255, 200, 50],
      [170, 0, 255],
      [57, 255, 20],
    ],
  },
  symbiosis: {
    name: 'Symbiosis',
    matrix: [
      [-0.10, 0.40, 0, 0, 0],
      [0.40, -0.10, 0, 0, 0],
      [0, 0, -0.10, 0.30, 0],
      [0, 0, 0.30, -0.10, 0],
      [0.20, 0.20, 0, 0, -0.10],
    ],
    colors: [
      [0, 240, 200],
      [200, 240, 0],
      [255, 100, 150],
      [150, 100, 255],
      [255, 200, 50],
    ],
  },
  chaos: {
    name: 'Chaos',
    matrix: [
      [0.1, -0.1, 0.2, -0.2, 0],
      [-0.2, 0.1, -0.1, 0.2, 0],
      [0, 0.2, -0.2, -0.1, 0.1],
      [0.1, 0, 0.2, -0.1, -0.2],
      [-0.1, 0, 0, 0.2, -0.1],
    ],
    colors: [
      [255, 50, 100],
      [50, 255, 100],
      [50, 100, 255],
      [255, 255, 50],
      [255, 50, 255],
    ],
  },
};

export class ParticleLife {
  constructor() {
    this.particles = [];
    this.width = 800;
    this.height = 600;
    this.matrix = PRESETS.cells.matrix;
    this.colors = PRESETS.cells.colors;
    this.speciesCount = 5;
    this.particlesPerSpecies = 150;
    this.friction = 0.5;
    this.interactionRadius = 80;
    this.minDist = 15;
    this.preset = 'cells';
    this.force = 1;
    this.mouse = { x: -1000, y: -1000, button: -1 };
    this.name = 'Particle Life';
    this.description = 'Self-organizing particles with attraction/repulsion rules. Watch life-like patterns emerge from a simple matrix.';
    this.instructions = 'Click: attract particles • Right click: repel particles • Click preset buttons to switch patterns';
  }

  getControls() {
    return `
      <div class="preset-row">
        <button class="preset-btn active" data-preset="cells">Cells</button>
        <button class="preset-btn" data-preset="galaxies">Galaxies</button>
        <button class="preset-btn" data-preset="predators">Predators</button>
        <button class="preset-btn" data-preset="symbiosis">Symbiosis</button>
        <button class="preset-btn" data-preset="chaos">Chaos</button>
      </div>
      <label>Count: <span id="plCount">750</span></label>
      <input type="range" id="plCountSlider" min="100" max="2000" value="750" step="50">
      <label>Speed</label>
      <input type="range" id="plSpeed" min="0.1" max="3" value="1" step="0.1">
    `;
  }

  init(width, height) {
    this.width = width;
    this.height = height;
    this.particles = [];
    this._spawnParticles();
  }

  _spawnParticles() {
    const perSpecies = Math.floor(this.particlesPerSpecies);
    for (let s = 0; s < this.speciesCount; s++) {
      const color = this.colors[s] || [255, 255, 255];
      for (let i = 0; i < perSpecies; i++) {
        this.particles.push({
          x: Math.random() * this.width,
          y: Math.random() * this.height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          species: s,
          color,
        });
      }
    }
  }

  update(dt) {
    const r = this.interactionRadius;
    const r2 = r * r;
    const minD = this.minDist;
    const forceMult = this.force * dt * 60;

    for (let i = 0; i < this.particles.length; i++) {
      const a = this.particles[i];
      let fx = 0, fy = 0;

      for (let j = 0; j < this.particles.length; j++) {
        if (i === j) continue;
        const b = this.particles[j];
        let dx = a.x - b.x;
        let dy = a.y - b.y;
        if (dx > this.width / 2) dx -= this.width;
        if (dx < -this.width / 2) dx += this.width;
        if (dy > this.height / 2) dy -= this.height;
        if (dy < -this.height / 2) dy += this.height;
        const d2 = dx * dx + dy * dy;
        if (d2 > r2 || d2 === 0) continue;

        const d = Math.sqrt(d2);
        const g = (this.matrix[a.species] && this.matrix[a.species][b.species]) ?? 0;

        let f;
        if (d < minD) {
          f = -forceMult * (1 / d) * 0.5;
        } else {
          f = forceMult * g * (1 / d) * 0.3;
        }

        fx += f * dx;
        fy += f * dy;
      }

      const mx = this.mouse.x - a.x;
      const my = this.mouse.y - a.y;
      const md = Math.sqrt(mx * mx + my * my);
      if (md < 150 && md > 0) {
        const mf = (1 - md / 150) * 0.8 * dt * 60;
        if (this.mouse.button === 0) {
          fx += mf * mx / md;
          fy += mf * my / md;
        } else if (this.mouse.button === 2) {
          fx -= mf * mx / md;
          fy -= mf * my / md;
        }
      }

      a.vx = (a.vx + fx) * this.friction;
      a.vy = (a.vy + fy) * this.friction;
      a.x += a.vx;
      a.y += a.vy;

      if (a.x < 0) a.x += this.width;
      if (a.x >= this.width) a.x -= this.width;
      if (a.y < 0) a.y += this.height;
      if (a.y >= this.height) a.y -= this.height;
    }
  }

  render(ctx) {
    ctx.fillStyle = 'rgba(10, 10, 18, 0.08)';
    ctx.fillRect(0, 0, this.width, this.height);

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      const [r, g, b] = p.color;
      drawGlow(ctx, p.x, p.y, 10, [r, g, b], 0.2);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  setPreset(name) {
    if (PRESETS[name]) {
      this.preset = name;
      this.matrix = PRESETS[name].matrix;
      this.colors = PRESETS[name].colors;
      this.reset();
    }
  }

  destroy() {
    this.particles = [];
  }

  handleClick(x, y, button) {
    this.mouse.x = x;
    this.mouse.y = y;
    this.mouse.button = button;
  }

  handleMove(x, y) {
    this.mouse.x = x;
    this.mouse.y = y;
  }

  handleUp() {
    this.mouse.button = -1;
  }

  reset() {
    const total = this.particles.length;
    this.particlesPerSpecies = Math.floor(total / this.speciesCount);
    this.init(this.width, this.height);
  }

  bindControls() {
    const slider = document.getElementById('plCountSlider');
    if (!slider) return;
    const countSpan = document.getElementById('plCount');
    slider.addEventListener('input', () => {
      countSpan.textContent = slider.value;
      this.particlesPerSpecies = Math.floor(parseInt(slider.value) / this.speciesCount);
      this.reset();
    });

    document.querySelectorAll('.preset-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.preset-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.setPreset(btn.dataset.preset);
      });
    });
  }
}
