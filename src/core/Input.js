// Ввод: клавиатура + виртуальный джойстик + способности на клавишах.
import { EventBus } from './EventBus.js';

export class Input {
  constructor(canvas) {
    this.keys = new Set();
    this.dir = { x: 0, z: 0 };

    // --- клавиатура ---
    window.addEventListener('keydown', e => {
      if (!this.keys.has(e.code)) {
        // Способности — на одиночное нажатие
        if (e.code === 'KeyR') EventBus.emit('ability:fake');
        if (e.code === 'KeyE') EventBus.emit('ability:scream');
        if (e.code === 'Space') EventBus.emit('ability:jump');
      }
      this.keys.add(e.code);
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code))
        e.preventDefault();
    });
    window.addEventListener('keyup', e => this.keys.delete(e.code));

    // --- виртуальный джойстик ---
    this.joyEl = document.getElementById('joy');
    this.knobEl = this.joyEl.querySelector('.knob');
    this.joyMax = 55;

    this.activeId = null;
    this.origin = { x: 0, y: 0 };
    this.current = { x: 0, y: 0 };
    this.joyVec = { x: 0, y: 0 };

    const onDown = e => {
      if (this.activeId !== null) return;
      const p = this._point(e);
      this.activeId = p.id;
      this.origin = { x: p.x, y: p.y };
      this.current = { x: p.x, y: p.y };
      this._showJoy(p.x, p.y);
      this._updateJoy();
    };
    const onMove = e => {
      const p = this._point(e);
      if (p.id !== this.activeId) return;
      this.current = { x: p.x, y: p.y };
      this._updateJoy();
    };
    const onUp = e => {
      const p = this._point(e);
      if (p.id !== this.activeId) return;
      this.activeId = null;
      this.joyVec = { x: 0, y: 0 };
      this.joyEl.classList.remove('on');
    };

    canvas.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  }

  _point(e) {
    if (e.changedTouches && e.changedTouches.length)
      return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY, id: e.changedTouches[0].identifier };
    return { x: e.clientX, y: e.clientY, id: 'mouse' };
  }

  _showJoy(x, y) {
    this.joyEl.style.left = (x - 65) + 'px';
    this.joyEl.style.top = (y - 65) + 'px';
    this.joyEl.classList.add('on');
  }

  _updateJoy() {
    let dx = this.current.x - this.origin.x;
    let dy = this.current.y - this.origin.y;
    const d = Math.hypot(dx, dy);
    if (d > this.joyMax) { dx = dx / d * this.joyMax; dy = dy / d * this.joyMax; }
    this.knobEl.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    this.joyVec = { x: dx / this.joyMax, y: dy / this.joyMax };
  }

  getDirection() {
    let x = 0, z = 0;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) z -= 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) z += 1;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) x -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) x += 1;

    x += this.joyVec.x;
    z += this.joyVec.y;

    const len = Math.hypot(x, z);
    if (len > 1) { x /= len; z /= len; }
    return { x, z };
  }
}