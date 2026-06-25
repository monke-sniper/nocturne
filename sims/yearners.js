import { Vec2 } from '../engine/vector.js';
import { Mind } from '../brain/mind.js';
import { Drive } from '../brain/drive.js';
import { Action } from '../brain/action.js';
import { PERSONALITIES, randomPersonality } from '../brain/personality.js';
import { drawGlow, rgba, hsl } from '../lib/color.js';

const CRITTER_COLORS = {
  bold: [255, 80, 80],
  timid: [100, 150, 255],
  social: [255, 200, 80],
  loner: [150, 80, 255],
  explorer: [80, 255, 200],
  lazy: [200, 200, 200],
  energetic: [255, 150, 50],
  balanced: [100, 220, 255],
};

const ICONS = {
  seekFood: '🍽️',
  rest: '💤',
  explore: '⟐',
  cluster: '◆',
  flee: '⚡',
  return: '↩',
};

export class Yearners {
  constructor() {
    this.critters = [];
    this.food = [];
    this.predators = [];
    this.width = 800;
    this.height = 600;
    this.spawnTimer = 0;
    this.name = 'Yearners';
    this.description = 'Drive-driven critters with hunger, rest, curiosity, memory, and emergent social roles. Each critter has a unique personality.';
    this.instructions = 'Left click: place food • Right click: place predator • R: reset';
    this.lastActionNames = new Map();
  }

  getControls() {
    return `
      <label>Critters: <span id="yrCount">60</span></label>
      <input type="range" id="yrCountSlider" min="20" max="150" value="60" step="5">
      <label>Food Count</label>
      <input type="range" id="yrFood" min="5" max="50" value="20" step="1">
      <button id="yrAddFood" class="control-btn">+ Sprinkle Food</button>
    `;
  }

  init(width, height) {
    this.width = width;
    this.height = height;
    this.critters = [];
    this.food = [];
    this.predators = [];
    this.spawnTimer = 0;

    for (let i = 0; i < 60; i++) {
      this._spawnCritter();
    }
    for (let i = 0; i < 20; i++) {
      this._spawnFood();
    }
  }

  _spawnCritter() {
    const personality = randomPersonality();
    const driveConfigs = [
      { name: 'hunger', initial: 20 + Math.random() * 30, decay: 3 + Math.random() * 2, max: 100 },
      { name: 'energy', initial: 50 + Math.random() * 40, decay: 1.5 + Math.random(), max: 100 },
      { name: 'curiosity', initial: 20 + Math.random() * 40, decay: 1.5 + Math.random(), max: 100 },
      { name: 'social', initial: 30 + Math.random() * 30, decay: 1 + Math.random(), max: 100 },
      { name: 'safety', initial: 10 + Math.random() * 20, decay: 2 + Math.random(), max: 100 },
    ];

    const drives = driveConfigs.map((c) => new Drive(c.name, c));
    const mind = new Mind(drives, this._createActions(), personality.weights);

    const c = {
      x: Math.random() * this.width,
      y: Math.random() * this.height,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      radius: 4 + Math.random() * 2,
      mind,
      personality,
      color: CRITTER_COLORS[personality.key] || [100, 220, 255],
      memory: { foodSpots: [], lastRestSpot: null },
      age: 0,
      actionTimer: 0,
    };

    this.critters.push(c);
    return c;
  }

  _createActions() {
    return [
      new Action('seek-food', {
        effects: { hunger: -25, energy: 3, curiosity: 3 },
        cooldown: 0.1,
      }),
      new Action('rest', {
        effects: { energy: -20, curiosity: 5 },
        cooldown: 0.2,
      }),
      new Action('explore', {
        effects: { curiosity: -20, hunger: 2, energy: 2 },
        cooldown: 0.05,
      }),
      new Action('cluster', {
        effects: { social: -25, safety: -5, hunger: 1 },
        cooldown: 0.1,
      }),
      new Action('flee', {
        effects: { safety: -30, energy: 5, curiosity: 3 },
        cooldown: 0.05,
      }),
      new Action('return-to-food', {
        effects: { hunger: -20, curiosity: 5 },
        cooldown: 0.15,
      }),
    ];
  }

  _spawnFood() {
    this.food.push({
      x: 30 + Math.random() * (this.width - 60),
      y: 30 + Math.random() * (this.height - 60),
      amount: 20 + Math.random() * 30,
      pulse: Math.random() * Math.PI * 2,
    });
  }

  update(dt) {
    this.spawnTimer += dt;
    if (this.spawnTimer > 3) {
      this.spawnTimer = 0;
      if (this.food.length < 40) this._spawnFood();
    }

    for (let i = this.food.length - 1; i >= 0; i--) {
      if (this.food[i].amount <= 0) {
        this.food.splice(i, 1);
      } else {
        this.food[i].pulse += dt;
      }
    }

    for (let i = 0; i < this.critters.length; i++) {
      const c = this.critters[i];
      c.age += dt;
      c.actionTimer -= dt;

      c.mind.tick(dt * 3);

      const hungerU = c.mind.getDriveUrgency('hunger');
      const energyU = c.mind.getDriveUrgency('energy');
      const curiosityU = c.mind.getDriveUrgency('curiosity');
      const socialU = c.mind.getDriveUrgency('social');
      const safetyU = c.mind.getDriveUrgency('safety');

      let targetX = c.x, targetY = c.y;
      let seeking = false;

      if (hungerU > 0.6) {
        const remembered = c.memory.foodSpots.filter(
          (s) => s.amount > 0 && Date.now() - s.time < 30000
        );
        if (remembered.length > 0) {
          remembered.sort((a, b) => b.amount - a.amount);
          const spot = remembered[0];
          targetX = spot.x;
          targetY = spot.y;
          seeking = true;
        }

        if (!seeking) {
          let nearest = null, nearDist = Infinity;
          for (let j = 0; j < this.food.length; j++) {
            const f = this.food[j];
            const d = Math.sqrt((f.x - c.x) ** 2 + (f.y - c.y) ** 2);
            if (d < nearDist) {
              nearDist = d;
              nearest = f;
            }
          }
          if (nearest) {
            targetX = nearest.x;
            targetY = nearest.y;
            seeking = true;
          }
        }
      }

      if (seeking) {
        const dx = targetX - c.x;
        const dy = targetY - c.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d > 5) {
          const speed = 50 + hungerU * 100;
          c.vx += (dx / d) * speed * dt;
          c.vy += (dy / d) * speed * dt;
        }
        if (d < 15) {
          for (let j = this.food.length - 1; j >= 0; j--) {
            const f = this.food[j];
            const fd = Math.sqrt((f.x - c.x) ** 2 + (f.y - c.y) ** 2);
            if (fd < 20) {
              const eaten = Math.min(f.amount, 15);
              f.amount -= eaten;
              c.mind.getDriveValue('hunger');
              const hungerDrive = c.mind.drives.find((d) => d.name === 'hunger');
              if (hungerDrive) hungerDrive.value -= eaten * 0.5;
              c.memory.foodSpots.push({
                x: f.x, y: f.y, amount: f.amount, time: Date.now(),
              });
              if (c.memory.foodSpots.length > 5) c.memory.foodSpots.shift();
              break;
            }
          }
        }
      }

      if (this.predators.length > 0 && safetyU > 0.3) {
        let nearestPred = null, predDist = Infinity;
        for (const p of this.predators) {
          const d = Math.sqrt((p.x - c.x) ** 2 + (p.y - c.y) ** 2);
          if (d < predDist) { predDist = d; nearestPred = p; }
        }
        if (nearestPred && predDist < 150) {
          const dx = c.x - nearestPred.x;
          const dy = c.y - nearestPred.y;
          const d = Math.sqrt(dx * dx + dy * dy) || 1;
          const fleeStr = 200 * (1 - predDist / 150);
          c.vx += (dx / d) * fleeStr * dt;
          c.vy += (dy / d) * fleeStr * dt;
        } else if (nearestPred && predDist < 250) {
          c.mind.drives.find((d) => d.name === 'safety').value += 10 * dt;
        }
      }

      if (socialU > 0.5 && !seeking && predDist > 200) {
        let nearestBuddy = null, buddyDist = Infinity;
        for (let j = 0; j < this.critters.length; j++) {
          if (j === i) continue;
          const other = this.critters[j];
          const d = Math.sqrt((other.x - c.x) ** 2 + (other.y - c.y) ** 2);
          if (d < buddyDist) { buddyDist = d; nearestBuddy = other; }
        }
        if (nearestBuddy && buddyDist < 120) {
          const dx = nearestBuddy.x - c.x;
          const dy = nearestBuddy.y - c.y;
          const d = Math.sqrt(dx * dx + dy * dy) || 1;
          c.vx += (dx / d) * 30 * dt;
          c.vy += (dy / d) * 30 * dt;
        }
      }

      if (curiosityU > 0.7 && !seeking) {
        c.vx += (Math.random() - 0.5) * 60 * dt;
        c.vy += (Math.random() - 0.5) * 60 * dt;
      }

      if (energyU > 0.7) {
        c.vx *= 0.95;
        c.vy *= 0.95;
      }

      const maxSpeed = 80 + hungerU * 40;
      const speed = Math.sqrt(c.vx * c.vx + c.vy * c.vy);
      if (speed > maxSpeed) {
        c.vx = (c.vx / speed) * maxSpeed;
        c.vy = (c.vy / speed) * maxSpeed;
      }

      c.x += c.vx * dt;
      c.y += c.vy * dt;
      c.vx *= 0.98;
      c.vy *= 0.98;

      c.x = Math.max(c.radius, Math.min(this.width - c.radius, c.x));
      c.y = Math.max(c.radius, Math.min(this.height - c.radius, c.y));
    }
  }

  render(ctx) {
    ctx.clearRect(0, 0, this.width, this.height);

    for (let i = 0; i < this.food.length; i++) {
      const f = this.food[i];
      if (f.amount <= 0) continue;
      const glow = 0.3 + Math.sin(f.pulse) * 0.1;
      drawGlow(ctx, f.x, f.y, 20, [57, 255, 20], glow * (f.amount / 50));
      ctx.fillStyle = `rgba(57, 255, 20, ${0.4 * (f.amount / 50)})`;
      ctx.beginPath();
      ctx.arc(f.x, f.y, 3 + f.amount * 0.1, 0, Math.PI * 2);
      ctx.fill();
    }

    for (let i = 0; i < this.predators.length; i++) {
      const p = this.predators[i];
      drawGlow(ctx, p.x, p.y, 60, [255, 50, 80], 0.5);
      ctx.fillStyle = 'rgba(255, 50, 80, 0.9)';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = `rgba(255, 50, 80, 0.2)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 150, 0, Math.PI * 2);
      ctx.stroke();
    }

    for (let i = 0; i < this.critters.length; i++) {
      const c = this.critters[i];
      const [r, g, b] = c.color;

      const hungerU = c.mind.getDriveUrgency('hunger');
      const energyU = c.mind.getDriveUrgency('energy');

      drawGlow(ctx, c.x, c.y, c.radius * 4, [r, g, b], 0.15);

      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
      ctx.fill();

      if (hungerU > 0.5) {
        ctx.fillStyle = `rgba(57, 255, 20, ${(hungerU - 0.5) * 2})`;
        ctx.beginPath();
        ctx.arc(c.x + c.radius + 2, c.y - c.radius, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      if (energyU > 0.6) {
        ctx.strokeStyle = `rgba(255, 170, 0, ${(energyU - 0.6) * 2})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.radius + 3 + (energyU - 0.6) * 3, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.fillStyle = `rgba(${r},${g},${b},0.3)`;
      ctx.font = '8px monospace';
      ctx.textAlign = 'center';
      const icon = c.personality.icon || '•';
      ctx.fillText(icon, c.x, c.y - c.radius - 4);
    }
  }

  destroy() {
    this.critters = [];
    this.food = [];
    this.predators = [];
  }

  handleClick(x, y, button) {
    if (button === 0) {
      this.food.push({ x, y, amount: 50, pulse: 0 });
    } else if (button === 2) {
      this.predators.push({ x, y, life: 5 });
    }
  }

  reset() {
    this.init(this.width, this.height);
  }

  bindControls() {
    const slider = document.getElementById('yrCountSlider');
    if (!slider) return;
    const countSpan = document.getElementById('yrCount');
    slider.addEventListener('input', () => {
      countSpan.textContent = slider.value;
      const target = parseInt(slider.value);
      while (this.critters.length < target) this._spawnCritter();
      while (this.critters.length > target) this.critters.pop();
    });

    const foodSlider = document.getElementById('yrFood');
    if (foodSlider) {
      foodSlider.addEventListener('input', () => {
        const target = parseInt(foodSlider.value);
        while (this.food.length < target) this._spawnFood();
        while (this.food.length > target) this.food.pop();
      });
    }

    const addFoodBtn = document.getElementById('yrAddFood');
    if (addFoodBtn) {
      addFoodBtn.addEventListener('click', () => {
        for (let i = 0; i < 10; i++) this._spawnFood();
      });
    }
  }
}
