// Точка входа.
import * as THREE from 'three';
import { CFG } from './config.js';
import { Input } from './core/Input.js';
import { EventBus } from './core/EventBus.js';
import { Sound } from './core/SoundManager.js';
import { SaveManager } from './core/SaveManager.js';
import { MusicManager, MUSIC_TRACKS } from './core/MusicManager.js';
import { HUD } from './ui/HUD.js';
import { UpgradeMenu } from './ui/UpgradeMenu.js';
import { AbilityBar } from './ui/AbilityBar.js';
import { QuestUI } from './ui/QuestUI.js';
import { Menu } from './ui/Menu.js';
import { LevelSelect } from './ui/LevelSelect.js';
import { GameScene } from './GameScene.js';

const container = document.getElementById('game');

// Определяем мобилку
const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
  || (window.innerWidth < 900 && 'ontouchstart' in window);

const renderer = new THREE.WebGLRenderer({
  antialias: !isMobile,              // на мобилке AA жрёт много
  powerPreference: 'high-performance'
});
// На мобилке pixelRatio = 1 — рендерит в 1 разрешении экрана, а не в 3-4
renderer.setPixelRatio(isMobile ? 1 : Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
// Тени — самая тяжёлая часть. На мобилке отключаем полностью
renderer.shadowMap.enabled = !isMobile;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setClearColor(0x1a120a);
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
// фон совпадает с меню — если сцена пуста, выглядит как часть меню, а не серый экран
scene.background = new THREE.Color(0x050302);
scene.fog = new THREE.Fog(0x050302, 30, 55);

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 200);
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

new HUD();
new UpgradeMenu();
new AbilityBar();
new QuestUI();
const menu = new Menu();
const levelSelect = new LevelSelect();

const input = new Input(renderer.domElement);
const game = new GameScene(renderer, camera, scene);
const music = new MusicManager(MUSIC_TRACKS);

// ================= ЗВУК: громкости =================
EventBus.on('settings:music', v => music.setVolume(v));
EventBus.on('settings:sfx', v => Sound.setVolume(v));
EventBus.on('settings:voice', v => {
  if (game.voiceHost) game.voiceHost.volume = v;
  if (game.voiceWife) game.voiceWife.volume = v;
  if (game.voiceDog) game.voiceDog.volume = v;
  if (game.voiceCat) game.voiceCat.volume = v;
  if (game.voiceRat) game.voiceRat.volume = v;
});

// ================= АУДИО WAKE =================
const wake = () => {
  Sound._ensure();
  music.start();
  window.removeEventListener('pointerdown', wake);
  window.removeEventListener('keydown', wake);
};
window.addEventListener('pointerdown', wake);
window.addEventListener('keydown', wake);

// ================= РЕКОРДЫ =================
EventBus.on('gameover', (sram, wave) => SaveManager.recordRun(sram, false));
EventBus.on('win', (sram, hasNext) => SaveManager.recordRun(sram, !hasNext));

// ================= ПОТОК: МЕНЮ → ВЫБОР УРОВНЯ → ИГРА =================
EventBus.on('menu:play', () => {
  menu.close();
  levelSelect.show();
});

EventBus.on('level:chosen', (levelId) => {
  game.start(input, levelId);
  startLoop();
});

// Из игры в меню (Esc или кнопка) — НЕ выключаем игру, просто открываем меню
EventBus.on('menu:open', () => {
  // Если игра не начата — просто открываем
  menu.open();
});

// Из уровня «В меню» — обнуляем сцену
EventBus.on('menu:from-level', () => {
  levelSelect.hide();
  menu.open();
});

// Рестарт после смерти/победы — открываем меню
EventBus.on('restart', () => {
  menu.open();
});

// Переход на следующий уровень
EventBus.on('next-level', () => {
  const next = game.currentLevelId + 1;
  if (next < 2) {
    game.start(input, next);
  } else {
    menu.open();
  }
});

// Escape — открыть меню
window.addEventListener('keydown', e => {
  if (e.code === 'Escape') menu.open();
});

// ================= ИГРОВОЙ ЦИКЛ =================
let loopStarted = false;
let last = performance.now();

function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  game.update(dt);
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

function startLoop() {
  if (loopStarted) return;
  loopStarted = true;
  last = performance.now();
  requestAnimationFrame(loop);
}

// Фоновый рендер (для меню)
startLoop();