# Nocturne

**A living simulation sandbox.** Five worlds where autonomous agents behave, feel, and decide — not through scripts or state machines, but through competing internal drives that shape every movement.

No dependencies. Just a browser and curiosity.

---

## Simulations

| # | Simulation | What you'll see |
|---|---|---|
| 1 | **Sentient Boids** | Flocking birds with shifting moods. Each boid's desire to cluster, scatter, or explore changes moment to moment based on its internal drives. Click to attract, right-click to repel. |
| 2 | **Particle Life** | Self-organizing particles governed by an attraction/repulsion matrix. Watch cells, galaxies, and predator-prey dynamics emerge from nothing but a 5×5 table of numbers. |
| 3 | **Circle Bounce** | Balls bouncing inside a circle — each with its own personality that shapes its trajectory. Some hug the wall, some cut across, some spiral. Their internal drives evolve their bounce patterns continuously. |
| 4 | **Yearners** | A small ecosystem of critters driven by hunger, energy, curiosity, social needs, and fear. They remember where food was found, flee from predators, and develop emergent roles based on personality. |
| 5 | **Mood Contagion** | Emotional epidemiology. Happiness, anxiety, and calm spread through proximity. Influencers broadcast their mood, mirrors absorb it. Waves of emotion ripple across the population. |

---

## How "sentience" works

Every agent in Nocturne runs on the same **drive-utility system**:

```
Every agent has internal drives (hunger, curiosity, safety, social, ...)
↓
Drives decay over time (hunger builds, energy depletes)
↓
Each possible action is scored by how well it would satisfy the most urgent drives
↓
The highest-scoring action wins (with a touch of randomness)
↓
Action executes, drives adjust
↓
Repeat every frame
```

This is not a state machine. There are no `if hungry then seekFood` rules. Behavior emerges from the competition between drives. An agent that just ate might explore or socialize; one that hasn't eaten in a while will seek food — but exactly how urgently depends on its personality weights and current context.

**Personalities** are just drive-weight multipliers. A "bold" personality has a low safety-drive weight, making it less likely to flee. An "explorer" has high curiosity weight. No special-case logic — just numbers.

---

## Getting started

### Option A: Open directly (easiest)

Serve the project directory:

```bash
# Using Python
python -m http.server 8080

# Using Node
npx serve .

# Using VS Code Live Server extension
```

Then open `http://localhost:8080` in your browser.

### Option B: Open the file directly

You can open `index.html` directly in most browsers, but some features (like module loading) may require a local server.

---

## Controls

| Key | Action |
|---|---|
| `1` `2` `3` `4` `5` | Switch simulation |
| `Space` | Pause / Resume |
| `R` | Reset current simulation |
| **Left click** | Sim-specific (attract, place food, inject mood, ...) |
| **Right click** | Sim-specific (repel, place predator, inject anxiety, ...) |

---

## Project structure

```
nocturne/
├── index.html              # Entry point
├── style.css               # Dark theme, glassmorphism sidebar
├── app.js                  # Sim router, canvas management, keyboard handling
├── engine/                 # Core runtime
│   ├── canvas.js           # High-DPI canvas setup and resize
│   ├── loop.js             # requestAnimationFrame loop with delta time
│   └── vector.js           # 2D vector math
├── brain/                  # The sentience layer
│   ├── drive.js            # Drive: a single internal need with decay and urgency
│   ├── action.js           # Action: something an agent can do, with drive effects
│   ├── mind.js             # Mind: evaluates and scores actions, picks the best
│   └── personality.js      # Personality profiles as drive-weight multipliers
├── sims/                   # Each simulation is a self-contained module
│   ├── boids.js            # Sentient Boids
│   ├── particle-life.js    # Particle Life
│   ├── circle-bounce.js    # Sentient Circle Bounce
│   ├── yearners.js         # Yearners ecosystem
│   └── mood-contagion.js   # Mood Contagion
└── lib/                    # Shared utilities
    ├── color.js            # Color palettes, glow rendering
    └── spatial-grid.js     # Spatial hash grid for fast neighbor queries
```

---

## Built with

- Vanilla JavaScript (ES modules)
- HTML5 Canvas 2D
- No frameworks, no dependencies, no build step

---

## License

MIT
