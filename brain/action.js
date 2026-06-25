export class Action {
  constructor(name, config) {
    this.name = name;
    this.effects = config.effects ?? {};
    this.cooldown = config.cooldown ?? 0;
    this._cooldownTimer = 0;
    this.perform = config.perform || (() => {});
  }

  canAct() {
    return this._cooldownTimer <= 0;
  }

  tick(agent, env, dt) {
    if (this._cooldownTimer > 0) this._cooldownTimer -= dt;
    this.perform(agent, env, dt);
  }

  resetCooldown() {
    this._cooldownTimer = this.cooldown;
  }
}
