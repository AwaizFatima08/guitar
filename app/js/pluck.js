// Geetar: Karplus-Strong plucked-string synthesis. Pure function, shared by the app and tests.

/** Render a plucked string as Float32 samples. */
export function renderPluck(freq, sampleRate, seconds = 2.2, opts = {}) {
  const brightness = opts.brightness ?? 0.5; // 0 dark .. 1 bright
  const decay = opts.decay ?? 0.996;
  const len = Math.floor(sampleRate * seconds);
  const out = new Float32Array(len);
  // The two-point average in the loop adds half a sample of delay.
  const period = sampleRate / freq - 0.5;
  const n = Math.max(2, Math.floor(period));
  const frac = period - n; // fractional delay via first-order allpass
  const line = new Float32Array(n);
  let seed = opts.seed ?? 12345;
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff * 2 - 1; };
  // Pre-filter the noise burst: darker plucks sound more like nylon / soft picking.
  let prev = 0;
  for (let i = 0; i < n; i++) { const r = rnd(); prev = prev + (1 - brightness * 0.8) * (r - prev); line[i] = prev; }
  let m = 0;
  for (let i = 0; i < n; i++) m += line[i];
  m /= n;
  for (let i = 0; i < n; i++) line[i] -= m;

  const C = (1 - frac) / (1 + frac);
  let apX = 0, apY = 0, idx = 0, last = line[n - 1];
  // Low strings ring longer; scale the loop loss with frequency.
  const loss = Math.pow(decay, Math.max(0.35, freq / 220));
  for (let i = 0; i < len; i++) {
    const cur = line[idx];
    const avg = loss * 0.5 * (cur + last);
    last = cur;
    const y = C * avg + apX - C * apY; // allpass for exact tuning
    apX = avg; apY = y;
    line[idx] = y;
    out[i] = cur;
    idx = (idx + 1) % n;
  }
  // Short fade-out to avoid a click.
  const fade = Math.min(len, Math.floor(sampleRate * 0.05));
  for (let i = 0; i < fade; i++) out[len - 1 - i] *= i / fade;
  return out;
}
