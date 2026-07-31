// Springs (port do Claude-of-Duty src/player/springs.js): oscilador amortecido sub-stepado
// (framerate-independent) + RecoilAxis (spring rápido + residual exponencial — sobe na hora,
// volta quase tudo, settle lento). Base do feel do viewmodel/recoil.
const TAU = Math.PI * 2;
const MAX_SUB_DT = 1 / 360;

export function approach(current, target, tau, dt) {
  if (tau <= 1e-6) return target;
  return target + (current - target) * Math.exp(-dt / tau);
}

export class Spring {
  constructor(freq = 8, damping = 0.7, value = 0) {
    this.freq = freq; this.damping = damping; this.value = value; this.velocity = 0; this.target = 0;
  }
  reset(value = 0) { this.value = value; this.velocity = 0; return this; }
  impulse(v) { this.velocity += v; return this; }
  step(dt) {
    if (dt <= 0) return this.value;
    const w = TAU * this.freq, k = w * w, c = 2 * this.damping * w;
    let remaining = dt, guard = 0;
    while (remaining > 1e-7 && guard++ < 24) {
      const h = remaining > MAX_SUB_DT ? MAX_SUB_DT : remaining;
      remaining -= h;
      const a = -k * (this.value - this.target) - c * this.velocity;
      this.velocity += a * h;
      this.value += this.velocity * h;
    }
    if (Math.abs(this.value - this.target) < 1e-7 && Math.abs(this.velocity) < 1e-6) { this.value = this.target; this.velocity = 0; }
    return this.value;
  }
}

export class RecoilAxis {
  constructor(freq = 9.5, damping = 0.52, residualTau = 0.3, residualShare = 0.34) {
    this.spring = new Spring(freq, damping, 0);
    this.residual = 0; this.residualTau = residualTau; this.residualShare = residualShare; this.value = 0;
  }
  reset() { this.spring.reset(0); this.residual = 0; this.value = 0; }
  kick(amount) {   // displacement kick: mais snappy que velocity kick
    this.spring.value += amount * (1 - this.residualShare);
    this.residual += amount * this.residualShare;
  }
  step(dt) {
    this.spring.step(dt);
    this.residual = approach(this.residual, 0, this.residualTau, dt);
    this.value = this.spring.value + this.residual;
    return this.value;
  }
}
