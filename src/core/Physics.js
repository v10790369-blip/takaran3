// Простая 2D-физика на плоскости XZ.
// Игрок — круг. Препятствия — AABB (прямоугольники). Всё остальное — точки.

export class Physics {
  constructor() {
    this.boxes = []; // { minX, maxX, minZ, maxZ }
  }

  addBox(centerX, centerZ, sizeX, sizeZ) {
    this.boxes.push({
      minX: centerX - sizeX / 2,
      maxX: centerX + sizeX / 2,
      minZ: centerZ - sizeZ / 2,
      maxZ: centerZ + sizeZ / 2,
    });
  }

  // Разрешает столкновение круга с AABB. Мутирует pos.
  resolveCircle(pos, radius) {
    for (const b of this.boxes) {
      const cx = Math.max(b.minX, Math.min(pos.x, b.maxX));
      const cz = Math.max(b.minZ, Math.min(pos.z, b.maxZ));
      let dx = pos.x - cx;
      let dz = pos.z - cz;
      let d2 = dx * dx + dz * dz;

      if (d2 < radius * radius) {
        if (d2 < 1e-6) {
          // центр внутри бокса — выталкиваем по ближайшей стороне
          const distL = pos.x - b.minX;
          const distR = b.maxX - pos.x;
          const distU = pos.z - b.minZ;
          const distD = b.maxZ - pos.z;
          const m = Math.min(distL, distR, distU, distD);
          if (m === distL) pos.x = b.minX - radius;
          else if (m === distR) pos.x = b.maxX + radius;
          else if (m === distU) pos.z = b.minZ - radius;
          else                  pos.z = b.maxZ + radius;
        } else {
          const d = Math.sqrt(d2);
          const push = radius - d;
          pos.x += (dx / d) * push;
          pos.z += (dz / d) * push;
        }
      }
    }
  }

  // Держим игрока внутри кухни.
  clampToBounds(pos, halfSize, radius) {
    const lim = halfSize - radius - 0.3;
    pos.x = Math.max(-lim, Math.min(lim, pos.x));
    pos.z = Math.max(-lim, Math.min(lim, pos.z));
  }

  static distance2D(a, b) {
    return Math.hypot(a.x - b.x, a.z - b.z);
  }
}