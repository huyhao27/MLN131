// Hand-authored level data. Everything else (collision, ground colors, tree placement) derives from it.
// Walking "into the forest" means going toward -z (up the screen).
export const DEMO_LAYOUT = {
  id: 'demo',
  PATH: [
    [0, 12, 5],
    [1, -6, 4.5],
    [-3, -24, 4],
    [-1, -42, 4],
    [3, -60, 3.5],
    [2, -78, 4],
    [-6, -96, 4.5],
    [-8, -112, 5],
    [0, -128, 4],
    [12, -146, 4],
    [18, -164, 5],
  ],
  CLEARINGS: {
    start: { x: 0, z: 8, rx: 11, rz: 8 },
    glade: { x: -9, z: -112, rx: 16, rz: 11 },
    vista: { x: 20, z: -170, rx: 14, rz: 10 },
  },
  STREAM: {
    points: [[-70, -50], [-40, -56], [-15, -58], [3, -60], [22, -57], [45, -64], [75, -62]],
    width: 6,
    bridge: { x: 3, z: -60, length: 10, width: 3.2 },
  },
  GAPS: [{ x: 13, z: -30, r: 4 }],
  ZONES: {
    glade: { x: -9, z: -112, triggerRadius: 10 },
    vista: { x: 20, z: -170, triggerRadius: 9 },
  },
  BOUNDS: { minX: -60, maxX: 60, minZ: -195, maxZ: 30 },
};
