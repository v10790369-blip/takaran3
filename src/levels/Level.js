// Базовый класс уровня. Наследники возвращают конфиг и рисуют свой мир.
export class Level {
    constructor(scene, physics) {
        this.scene = scene;
        this.physics = physics;
        this.size = 30;
        this.wallHeight = 4;
        this.obstacles = [];
    }
    build() { }
    getSpawnPos() { return { x: 0, z: 0 }; }
    getDenPos() { return { x: -14, z: -3 }; }
    getDenRadius() { return 1.7; }
    getExitPos() { return { x: 13.5, z: -12 }; }
    getHostPos() { return null; }
    getPetPos() { return null; }
    getTVPos() { return null; }
    getRatPos() { return null; }
    getPrankSpots() { return []; }
    getLightingPresets() { return []; }
    getName() { return 'УРОВЕНЬ'; }
    hasSpotlight() { return false; }
    update(dt, player, time) { }
}