export function hsl(h, s, l) {
  return `hsl(${h}, ${s}%, ${l}%)`;
}

export function hsla(h, s, l, a) {
  return `hsla(${h}, ${s}%, ${l}%, ${a})`;
}

export function lerpColor(a, b, t) {
  const result = [...a];
  for (let i = 0; i < 3; i++) {
    result[i] = Math.round(a[i] + (b[i] - a[i]) * t);
  }
  return result;
}

export function rgb(r, g, b) {
  return `rgb(${r}, ${g}, ${b})`;
}

export function rgba(r, g, b, a) {
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

export function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [255, 255, 255];
}

const PALETTE = {
  cyan: [0, 240, 255],
  magenta: [255, 0, 170],
  amber: [255, 170, 0],
  lime: [57, 255, 20],
  violet: [170, 0, 255],
  rose: [255, 50, 100],
  teal: [0, 200, 200],
  orange: [255, 120, 0],
};

export function getPaletteColor(name) {
  return PALETTE[name] || PALETTE.cyan;
}

export function randomNeonColor() {
  const keys = Object.keys(PALETTE);
  return PALETTE[keys[Math.floor(Math.random() * keys.length)]];
}

export function drawGlow(ctx, x, y, radius, color, intensity = 1) {
  const [r, g, b] = color;
  const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
  grad.addColorStop(0, `rgba(${r},${g},${b},${0.4 * intensity})`);
  grad.addColorStop(0.3, `rgba(${r},${g},${b},${0.15 * intensity})`);
  grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}
