import { SpatialGrid } from '../lib/spatial-grid.js';
import { Mind } from '../brain/mind.js';
import { Drive } from '../brain/drive.js';
import { Action } from '../brain/action.js';
import { randomPersonality } from '../brain/personality.js';
import { drawGlow, rgba, hsl } from '../lib/color.js';

export class MoodContagion {
  constructor() {
    this.agents = [];
    this.width = 800;
    this.height = 600;
    this.grid = new SpatialGrid(80);
    this.neighbors = [];
    this.mouse = { x: -100, y: -100 };
    this.lastClick = 0;
    this.name = 'Mood Contagion';
    this.description = 'Emotions spread through proximity. Watch waves of happiness, anxiety, and calm ripple through the crowd.';
    this.instructions = 'Left click: inject happiness at cursor • Right click: inject anxiety • R: reset';
  }

  getControls() {
    return `
      <label>Agents: <span id="mcCount">150</span></label>
      <input type="range" id="mcCountSlider" min="50" max="400" value="150" step="10">
      <label>Contagion Speed</label>
      <input type="range" id="mcSpeed" min="0.1" max="3" value="1" step="0.1">
      <button id="mcReset" class="control-btn">Reset Moods</button>
    `;
  }

  init(width, height) {
    this.width = width;
    this.height = height;
    this.agents = [];

    for (let i = 0; i < 150; i++) {
      this._spawnAgent();
    }
  }

  _spawnAgent() {
    const isInfluencer = Math.random() < 0.15;
    const isAbsorber = Math.random() < 0.15;
    const personality = randomPersonality();

    const drives = [
      new Drive('conformity', { initial: 30 + Math.random() * 40, decay: 2 + Math.random(), max: 100 }),
      new Drive('novelty', { initial: 20 + Math.random() * 30, decay: 1 + Math.random(), max: 100 }),
      new Drive('calm-desire', { initial: 40 + Math.random() * 30, decay: 1.5 + Math.random(), max: 100 }),
    ];

    const actions = [
      new Action('match-mood', {
        effects: { conformity: -30, novelty: 5, 'calm-desire': 5 },
        perform: () => {},
      }),
      new Action('seek-contrast', {
        effects: { novelty: -25, conformity: 10, 'calm-desire': 5 },
        perform: () => {},
      }),
      new Action('spread-calm', {
        effects: { 'calm-desire': -25, conformity: 10 },
        perform: () => {},
      }),
    ];

    const mind = new Mind(drives, actions, personality.weights);

    return {
      x: Math.random() * this.width,
      y: Math.random() * this.height,
      valence: (Math.random() - 0.5) * 2,
      arousal: Math.random() * 2,
      targetValence: (Math.random() - 0.5) * 0.5,
      targetArousal: Math.random() * 0.5,
      influenceRadius: isInfluencer ? 60 + Math.random() * 40 : 25 + Math.random() * 20,
      susceptibility: isAbsorber ? 0.8 + Math.random() * 0.2 : 0.2 + Math.random() * 0.3,
      broadcastStrength: isInfluencer ? 0.8 + Math.random() * 0.2 : 0.15 + Math.random() * 0.25,
      mind,
      personality,
      radius: isInfluencer ? 4 : 3,
      isInfluencer,
      isAbsorber,
      age: 0,
    };
  }

  _moodToColor(valence, arousal) {
    const v = Math.max(-1, Math.min(1, valence));
    const a = Math.max(0, Math.min(1, arousal));
    let r, g, b;

    if (v > 0) {
      const t = v;
      r = Math.round(50 + t * 100);
      g = Math.round(100 + t * 155);
      b = Math.round(255 - t * 155);
    } else {
      const t = -v;
      r = Math.round(255 - t * 100);
      g = Math.round(200 * (1 - t * 0.5));
      b = Math.round(180 - t * 150);
    }

    const bright = 0.5 + a * 0.5;
    return [
      Math.round(r * bright),
      Math.round(g * bright),
      Math.round(b * bright),
    ];
  }

  update(dt) {
    this.grid.clear();
    for (let i = 0; i < this.agents.length; i++) {
      this.grid.insert(this.agents[i]);
    }

    for (let i = 0; i < this.agents.length; i++) {
      const a = this.agents[i];
      a.age += dt;

      a.mind.tick(dt * 2);

      let avgValence = 0, avgArousal = 0, influenceCount = 0;
      this.grid.query(a.x, a.y, 100, this.neighbors);

      for (let j = 0; j < this.neighbors.length; j++) {
        const other = this.neighbors[j];
        if (other === a) continue;
        const dx = other.x - a.x;
        const dy = other.y - a.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < other.influenceRadius) {
          const strength = other.broadcastStrength * (1 - d / other.influenceRadius);
          avgValence += other.valence * strength;
          avgArousal += other.arousal * strength;
          influenceCount++;
        }
      }

      if (influenceCount > 0) {
        const conformityU = a.mind.getDriveUrgency('conformity');
        const noveltyU = a.mind.getDriveUrgency('novelty');
        const contagionRate = a.susceptibility * (0.5 + conformityU * 0.5) * 2;
        const noveltyRate = (0.3 + noveltyU * 0.7) * 0.3;

        a.targetValence += (avgValence / influenceCount - a.targetValence) * contagionRate * dt;
        a.targetArousal += (avgArousal / influenceCount - a.targetArousal) * contagionRate * dt;

        const noise = (Math.random() - 0.5) * noveltyRate * dt;
        a.targetValence += noise;
        a.targetArousal += noise * 0.5;
      }

      a.targetValence = Math.max(-1, Math.min(1, a.targetValence));
      a.targetArousal = Math.max(0, Math.min(1, a.targetArousal));

      a.valence += (a.targetValence - a.valence) * 2 * dt;
      a.arousal += (a.targetArousal - a.arousal) * 2 * dt;

      const calmU = a.mind.getDriveUrgency('calm-desire');
      if (calmU > 0.6) {
        a.targetArousal += (0 - a.targetArousal) * calmU * dt;
      }

      const driftX = (Math.random() - 0.5) * 40;
      const driftY = (Math.random() - 0.5) * 40;
      a.x += (driftX + (a.valence * 10)) * dt;
      a.y += (driftY + (a.arousal * 10)) * dt;
      a.x = ((a.x % this.width) + this.width) % this.width;
      a.y = ((a.y % this.height) + this.height) % this.height;
    }
  }

  render(ctx) {
    ctx.fillStyle = 'rgba(10, 10, 18, 0.05)';
    ctx.fillRect(0, 0, this.width, this.height);

    for (let i = 0; i < this.agents.length; i++) {
      const a = this.agents[i];
      const color = this._moodToColor(a.valence, a.arousal);
      const [r, g, b] = color;

      drawGlow(ctx, a.x, a.y, a.influenceRadius, color, a.broadcastStrength * 0.3);

      for (let j = i + 1; j < this.agents.length; j++) {
        const other = this.agents[j];
        const dx = other.x - a.x;
        const dy = other.y - a.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 40) {
          const t = 1 - d / 40;
          const avgR = Math.round((r + this._moodToColor(other.valence, other.arousal)[0]) / 2);
          const avgG = Math.round((g + this._moodToColor(other.valence, other.arousal)[1]) / 2);
          const avgB = Math.round((b + this._moodToColor(other.valence, other.arousal)[2]) / 2);
          ctx.strokeStyle = `rgba(${avgR},${avgG},${avgB},${t * 0.15})`;
          ctx.lineWidth = t;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(other.x, other.y);
          ctx.stroke();
        }
      }

      const size = a.radius * (0.8 + a.arousal * 0.4);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.beginPath();
      ctx.arc(a.x, a.y, size, 0, Math.PI * 2);
      ctx.fill();

      if (a.isInfluencer) {
        ctx.strokeStyle = `rgba(${r},${g},${b},0.3)`;
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 3]);
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.radius + 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    const mx = this.mouse.x;
    const my = this.mouse.y;
    const timeSinceClick = (performance.now() - this.lastClick) / 1000;
    if (timeSinceClick < 1.5 && mx > 0 && my > 0) {
      const [mr, mg, mb] = this.mouse.button === 0 ? [57, 255, 20] : [255, 50, 80];
      const alpha = 1 - timeSinceClick / 1.5;
      drawGlow(ctx, mx, my, 120, [mr, mg, mb], alpha * 0.3);
      ctx.fillStyle = `rgba(${mr},${mg},${mb},${alpha * 0.2})`;
      ctx.beginPath();
      ctx.arc(mx, my, 120, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  destroy() {
    this.agents = [];
  }

  handleClick(x, y, button) {
    this.lastClick = performance.now();
    const valenceInjection = button === 0 ? 0.8 : -0.8;
    const arousalInjection = button === 0 ? -0.3 : 0.6;

    for (let i = 0; i < this.agents.length; i++) {
      const a = this.agents[i];
      const dx = a.x - x;
      const dy = a.y - y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < 120) {
        const strength = (1 - d / 120) * 0.8;
        a.targetValence += valenceInjection * strength;
        a.targetArousal += arousalInjection * strength;
      }
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
    const slider = document.getElementById('mcCountSlider');
    if (!slider) return;
    const countSpan = document.getElementById('mcCount');
    slider.addEventListener('input', () => {
      countSpan.textContent = slider.value;
      const target = parseInt(slider.value);
      while (this.agents.length < target) this._spawnAgent();
      while (this.agents.length > target) this.agents.pop();
    });

    const resetBtn = document.getElementById('mcReset');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        for (const a of this.agents) {
          a.valence = (Math.random() - 0.5) * 0.5;
          a.arousal = Math.random() * 0.3;
          a.targetValence = 0;
          a.targetArousal = 0.2;
        }
      });
    }
  }
}
