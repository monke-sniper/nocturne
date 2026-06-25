import { CanvasManager } from './engine/canvas.js';
import { Loop } from './engine/loop.js';
import { SentientBoids } from './sims/boids.js';
import { ParticleLife } from './sims/particle-life.js';
import { CircleBounce } from './sims/circle-bounce.js';
import { Yearners } from './sims/yearners.js';
import { MoodContagion } from './sims/mood-contagion.js';

const SIMS = [
  { id: 'boids', class: SentientBoids, icon: '⟐', label: 'Sentient Boids' },
  { id: 'particle-life', class: ParticleLife, icon: '✦', label: 'Particle Life' },
  { id: 'circle-bounce', class: CircleBounce, icon: '◉', label: 'Circle Bounce' },
  { id: 'yearners', class: Yearners, icon: '◈', label: 'Yearners' },
  { id: 'mood-contagion', class: MoodContagion, icon: '◍', label: 'Mood Contagion' },
];

class App {
  constructor() {
    this.currentSim = null;
    this.currentIndex = 0;
    this.paused = false;
    this.canvas = null;
    this.loop = null;
    this.simInstances = new Map();

    this._setupDOM();
    this._setupCanvas();
    this._setupLoop();
    this._bindKeyboard();
    this._bindGlobalControls();
    this._switchSim(0);
  }

  _setupDOM() {
    this.container = document.getElementById('canvas-container');
    this.sidebar = document.getElementById('sidebar');
    this.simList = document.getElementById('sim-list');
    this.controlsPanel = document.getElementById('controls');
    this.simTitle = document.getElementById('sim-title');
    this.simDesc = document.getElementById('sim-desc');
    this.simInstructions = document.getElementById('sim-instructions');
    this.fpsDisplay = document.getElementById('fps-display');
    this.countDisplay = document.getElementById('count-display');
    this.pauseBtn = document.getElementById('pause-btn');
    this.resetBtn = document.getElementById('reset-btn');

    SIMS.forEach((sim, i) => {
      const btn = document.createElement('button');
      btn.className = `sim-btn ${i === 0 ? 'active' : ''}`;
      btn.dataset.index = i;
      btn.innerHTML = `<span class="sim-icon">${sim.icon}</span><span class="sim-label">${sim.label}</span>`;
      btn.addEventListener('click', () => this._switchSim(i));
      this.simList.appendChild(btn);
    });
  }

  _setupCanvas() {
    this.canvas = new CanvasManager(this.container);
  }

  _setupLoop() {
    this.loop = new Loop((dt) => this._tick(dt));
    this.loop.start();
  }

  _switchSim(index) {
    if (this.currentSim) {
      this.currentSim.destroy();
    }

    this.currentIndex = index;
    const simConfig = SIMS[index];

    const existing = this.simInstances.get(simConfig.id);
    this.currentSim = existing || new simConfig.class();
    if (!existing) {
      this.simInstances.set(simConfig.id, this.currentSim);
    }

    if (this.currentSim.bindControls) {
      this.controlsPanel.innerHTML = this.currentSim.getControls() || '';
      setTimeout(() => this.currentSim.bindControls(), 0);
    } else {
      this.controlsPanel.innerHTML = '';
    }

    this.currentSim.init(this.canvas.width, this.canvas.height);

    this.simTitle.textContent = `${simConfig.icon} ${this.currentSim.name}`;
    this.simDesc.textContent = this.currentSim.description || '';
    this.simInstructions.textContent = this.currentSim.instructions || '';

    document.querySelectorAll('.sim-btn').forEach((btn, i) => {
      btn.classList.toggle('active', i === index);
    });
  }

  _tick(dt) {
    const w = this.canvas.width;
    const h = this.canvas.height;

    if (this.currentSim) {
      if (this.currentSim.update) this.currentSim.update(dt);
      this.canvas.clear();
      if (this.currentSim.render) this.currentSim.render(this.canvas.ctx);

      if (this.fpsDisplay) {
        this.fpsDisplay.textContent = `${Math.round(this.loop.fps)} FPS`;
      }
      if (this.countDisplay) {
        const count = this._getCount();
        this.countDisplay.textContent = `${count} agents`;
      }
    }
  }

  _getCount() {
    const sim = this.currentSim;
    if (!sim) return 0;
    if (sim.boids) return sim.boids.length;
    if (sim.particles) return sim.particles.length;
    if (sim.balls) return sim.balls.length;
    if (sim.critters) return sim.critters.length;
    if (sim.agents) return sim.agents.length;
    return 0;
  }

  _bindKeyboard() {
    document.addEventListener('keydown', (e) => {
      const num = parseInt(e.key);
      if (num >= 1 && num <= 5) {
        this._switchSim(num - 1);
        return;
      }
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        this._togglePause();
        return;
      }
      if (e.key === 'r' || e.key === 'R') {
        if (this.currentSim && this.currentSim.reset) {
          this.currentSim.reset();
        }
        return;
      }
    });

    this.canvas.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    this.canvas.canvas.addEventListener('mousedown', (e) => {
      const rect = this.canvas.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (this.currentSim && this.currentSim.handleClick) {
        this.currentSim.handleClick(x, y, e.button);
      }
    });

    this.canvas.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (this.currentSim && this.currentSim.handleMove) {
        this.currentSim.handleMove(x, y);
      }
    });

    this.canvas.canvas.addEventListener('mouseup', (e) => {
      if (this.currentSim && this.currentSim.handleUp) {
        this.currentSim.handleUp();
      }
    });
  }

  _bindGlobalControls() {
    if (this.pauseBtn) {
      this.pauseBtn.addEventListener('click', () => this._togglePause());
    }
    if (this.resetBtn) {
      this.resetBtn.addEventListener('click', () => {
        if (this.currentSim && this.currentSim.reset) {
          this.currentSim.reset();
        }
      });
    }
  }

  _togglePause() {
    this.paused = this.loop.togglePause();
    if (this.pauseBtn) {
      this.pauseBtn.textContent = this.paused ? '▶' : '⏸';
      this.pauseBtn.title = this.paused ? 'Resume' : 'Pause';
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new App();
});
