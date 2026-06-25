export const PERSONALITIES = {
  balanced: {
    name: 'Balanced',
    icon: '✦',
    weights: {},
  },
  bold: {
    name: 'Bold',
    icon: '⚡',
    weights: {
      safety: 0.3,
      curiosity: 1.5,
    },
  },
  timid: {
    name: 'Timid',
    icon: '🌙',
    weights: {
      safety: 2.0,
      curiosity: 0.5,
    },
  },
  social: {
    name: 'Social',
    icon: '◆',
    weights: {
      social: 2.0,
      solitude: 0.3,
    },
  },
  loner: {
    name: 'Loner',
    icon: '◇',
    weights: {
      social: 0.3,
      solitude: 2.0,
    },
  },
  explorer: {
    name: 'Explorer',
    icon: '⟐',
    weights: {
      curiosity: 2.5,
      safety: 0.6,
    },
  },
  lazy: {
    name: 'Lazy',
    icon: '◌',
    weights: {
      energy: 0.5,
      curiosity: 0.4,
    },
  },
  energetic: {
    name: 'Energetic',
    icon: '⟡',
    weights: {
      energy: 2.0,
      curiosity: 1.3,
    },
  },
};

export function randomPersonality() {
  const keys = Object.keys(PERSONALITIES);
  const key = keys[Math.floor(Math.random() * keys.length)];
  return { key, ...PERSONALITIES[key] };
}

export function blendPersonality(baseKey, mixKey, blend = 0.5) {
  const base = PERSONALITIES[baseKey]?.weights ?? {};
  const mix = PERSONALITIES[mixKey]?.weights ?? {};
  const blended = {};
  const allKeys = new Set([...Object.keys(base), ...Object.keys(mix)]);
  for (const k of allKeys) {
    const b = base[k] ?? 1;
    const m = mix[k] ?? 1;
    blended[k] = b + (m - b) * blend;
  }
  return blended;
}
