export class Mind {
  constructor(drives, actions, personality = {}) {
    this.drives = drives;
    this.actions = actions;
    this.personality = personality;
    this.lastAction = null;
  }

  tick(dt) {
    for (const drive of this.drives) {
      drive.tick(dt);
    }

    let bestScore = -Infinity;
    let bestAction = null;

    for (const action of this.actions) {
      if (!action.canAct()) continue;

      let score = 0;
      for (const [driveName, delta] of Object.entries(action.effects)) {
        const drive = this.drives.find((d) => d.name === driveName);
        if (!drive) continue;
        const weight = this.personality[driveName] ?? 1;
        if (delta < 0) {
          score += drive.urgency() * Math.abs(delta) * weight;
        } else {
          score -= drive.urgency() * delta * weight * 0.3;
        }
      }

      score += (Math.random() - 0.5) * 0.15;

      if (score > bestScore) {
        bestScore = score;
        bestAction = action;
      }
    }

    if (bestAction) {
      for (const [driveName, delta] of Object.entries(bestAction.effects)) {
        const drive = this.drives.find((d) => d.name === driveName);
        if (drive) drive.modify(delta);
      }
      bestAction.resetCooldown();
      this.lastAction = bestAction;
      return bestAction;
    }

    return null;
  }

  getDriveValue(name) {
    const drive = this.drives.find((d) => d.name === name);
    return drive ? drive.value : 0;
  }

  getDriveUrgency(name) {
    const drive = this.drives.find((d) => d.name === name);
    return drive ? drive.urgency() : 0;
  }

  reset() {
    for (const drive of this.drives) drive.reset();
    this.lastAction = null;
  }
}
