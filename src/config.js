export const CFG = {
  WALL_HEIGHT: 4,
  KITCHEN_SIZE: 30,
  PLAYER_RADIUS: 0.55,
  PLAYER_ACCEL: 42,
  PLAYER_DRAG: 1.2,
  PLAYER_MAX_SPEED: 13,
  PLAYER_ROT_LERP: 12,

  HP: 5, INVULN_TIME: 1.4, KNOCKBACK: 9,
  PRANK_FILL_RATE: 1.25, PRANK_DECAY: 2, PRANK_COOLDOWN: 7,

  SLIPPER_SPEED: 14, SLIPPER_GRAVITY: 24, SLIPPER_LANDED_TIME: 4.5,
  SLIPPER_SPAWN_INTERVAL: 2.6, SLIPPER_BASE_LIMIT: 1,

  // 👁️ Кот видит дальше — увеличил с 4.5 до 8
  CAT_WAKE_DIST: 8, CAT_SPEED: 8.5, CAT_SLEEP_TIME: 6,
  CAT_HOME_SPEED: 3, CAT_ACCEL: 18, CAT_TURN_LERP: 3.5,

  SPRAY_LIFETIME: 6, SPRAY_MAX_R: 4.2, SPRAY_GROW: 1.8,

  WAVE_THRESHOLDS: [3, 6, 10, 15],
  MAX_WAVE: 5,

  FOOD: { SPAWN_INTERVAL: 14, MAX_ON_FLOOR: 2, CARRY_SLOW: 0.5, STEAL_TIME: 0.9, DELIVER_POINTS: 30 },
  TRAPS: { SPAWN_BETWEEN_WAVES: 2, STICKY_DURATION: 2.0, POISON_DURATION: 3.0, POISON_DPS: 1.2 },
  RAGDOLL: { DURATION: 1.1, SPIN: 22, BOUNCE: 6 },
  GLUE: { DURATION: 2.0, SPEED: 2.2 },
  BOSS: {
    SPEED: 5.5, CHASE_RANGE: 3.2, SWING_RANGE: 3.0,
    WINDUP: 0.45, SWING: 0.12, RECOVER: 0.55,
    IDLE_BETWEEN: 0.6, HIT_RADIUS: 3.0, DAMAGE: 1, RADIUS: 0.7,
  },

  LIGHTING_PRESETS: [
    { name: 'УТРО', hemi: 0xffffff, ground: 0x443322, sun: 0xfff0d0, sunIntensity: 1.10, fogColor: 0x1a120a, fogNear: 30, fogFar: 55, ambInt: 0.9 },
    { name: 'ДЕНЬ', hemi: 0xffffff, ground: 0x554433, sun: 0xffe8a0, sunIntensity: 1.20, fogColor: 0x201a10, fogNear: 28, fogFar: 52, ambInt: 1.0 },
    { name: 'ВЕЧЕР', hemi: 0xffd8b0, ground: 0x332211, sun: 0xff9060, sunIntensity: 0.85, fogColor: 0x2a1508, fogNear: 24, fogFar: 45, ambInt: 0.8 },
    { name: 'ЗАКАТ', hemi: 0xc0a0c0, ground: 0x221133, sun: 0x8050a0, sunIntensity: 0.55, fogColor: 0x100818, fogNear: 20, fogFar: 38, ambInt: 0.65 },
    { name: 'НОЧЬ', hemi: 0x8090c0, ground: 0x334466, sun: 0x7070c0, sunIntensity: 0.55, fogColor: 0x0e1626, fogNear: 26, fogFar: 55, ambInt: 0.75 },
  ],
};

export const COLORS = {
  SRAM: '#ffe066', HP: '#ff5555', WAVE: '#ff9f43', VENT: '#7dff7d',
};

export const UPGRADES = [
  { id: 'speed', name: 'Ускорение', desc: '+15% к скорости', icon: '⚡', apply: p => p.speedMul *= 1.15 },
  { id: 'armor', name: 'Хитиновая броня', desc: '+2 к макс. HP', icon: '🛡️', apply: p => { p.maxHp += 2; p.hp += 2; } },
  { id: 'sticky', name: 'Липкие лапки', desc: 'Скольжение меньше', icon: '🦶', apply: p => p.dragMul *= 1.4 },
  { id: 'magnet', name: 'Нюх на крошки', desc: 'Крошки притягиваются', icon: '🧲', apply: p => p.hasMagnet = true },
  { id: 'fake', name: 'Притвориться мёртвым', desc: '2 сек неуязвимости (R)', icon: '💀', apply: p => p.hasFakeDeath = true },
  { id: 'scream', name: 'Ор истерики', desc: 'Хозяин замирает (E)', icon: '😱', apply: p => p.hasScream = true },
  { id: 'jump', name: 'Прыжок на стол', desc: 'Раз в 8 сек — прыжок', icon: '🦘', apply: p => p.hasJump = true },
];

// 🎨 Скины — открываются за рекорды
export const SKINS = [
  { id: 'default', name: 'Жора', desc: 'Обычный таракан', icon: '🪳', color: 0x4a2c14, shellColor: 0x5c3819, unlock: null },
  { id: 'golden', name: 'Золотой', desc: '1000 срама', icon: '⭐', color: 0xd4af37, shellColor: 0xf5d060, unlock: { type: 'sram', value: 1000 } },
  { id: 'ghost', name: 'Призрак', desc: 'Одержать победу', icon: '👻', color: 0x9098b8, shellColor: 0xb0b8d8, transparent: true, unlock: { type: 'wins', value: 1 } },
  { id: 'ninja', name: 'Ниндзя', desc: '10 пробежек', icon: '🥷', color: 0x1a1a1a, shellColor: 0x2a2a2a, unlock: { type: 'runs', value: 10 } },
  { id: 'king', name: 'Король кухни', desc: '5000 срама', icon: '👑', color: 0x8a2a4a, shellColor: 0xb04070, unlock: { type: 'sram', value: 5000 } },
];