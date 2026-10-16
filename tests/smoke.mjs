import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Script, createContext } from 'node:vm';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (name) => readFileSync(resolve(root, name), 'utf8');

function loadGame() {
  const html = read('index.html');
  const [, source] = html.match(/<script>\n([\s\S]*?)\n<\/script>/) || [];
  assert.ok(source, 'No se encontró el motor del juego');

  const elements = new Map();
  const globalListeners = {};
  const hiddenControls = Array.from({length:7},()=>({inert:false}));
  const element = (id) => {
    if (!elements.has(id)) elements.set(id, {
      classList: (() => { const classes = new Set(['statsModal', 'manualModal'].includes(id) ? ['hidden'] : []); return { add(name) { classes.add(name); }, remove(name) { classes.delete(name); }, contains(name) { return classes.has(name); } }; })(),
      style: {}, textContent: '', value: id === 'mode' ? 'campaign' : id === 'difficulty' ? 'normal' : '',
      focus() { context.document.activeElement = this; }, blur() {}, listeners: {}, addEventListener(type,fn) { (this.listeners[type] ||= []).push(fn); }, dispatch(type,event) { for(const fn of this.listeners[type]||[])fn(event); }, setPointerCapture() {}, hasPointerCapture(){return false}, releasePointerCapture() {}, getBoundingClientRect(){return {width:400,height:400}}, appendChild() {},
    });
    return elements.get(id);
  };
  const context = {
    console, Date, Intl, Math, JSON, Set, Map, performance: { now: () => 0 },
    localStorage: { getItem: () => null, setItem() {} },
    HTMLElement: class {}, confirm: () => true, addEventListener(type,fn) { (globalListeners[type] ||= []).push(fn); }, requestAnimationFrame() {},
    window: { addEventListener(type,fn) { (globalListeners[type] ||= []).push(fn); } },
    document: {
      activeElement: null, body: { classList: { toggle() {} } }, documentElement: { style: { setProperty() {} } },
      getElementById(id) {
        const node = element(id);
        if (id === 'game') {
          node.getContext ||= () => ({
            clearRect() {}, createLinearGradient: () => ({ addColorStop() {} }), fillRect() {}, beginPath() {},
            moveTo() {}, lineTo() {}, stroke() {}, arc() {}, fill() {}, fillText() {}, rect() {},
          });
        }
        return node;
      },
      querySelectorAll: (selector) => selector.includes('header, .hud') ? hiddenControls : [], addEventListener() {}, createElement: () => element(`created-${elements.size}`),
    },
  };
  createContext(context);
  const instrumented = source.replace(/\}\)\(\);\s*$/, `globalThis.__gameTest = {
    init, start, tick, direction, pause, loop, reachable, makeObstacles, placeFood, openStats, closeStats, openManual, closeManual, syncWelcome,
    get game() { return game; }, get status() { return status; }, get manualIndex() { return manualIndex; }, get activeElement() { return document.activeElement; }
  };})();`);
  new Script(instrumented).runInContext(context);
  context.__gameTest.hiddenControls=hiddenControls;
  context.__gameTest.getElement=element;
  context.__gameTest.dispatchKey=(event)=>{for(const fn of globalListeners.keydown||[])fn(event)};
  return context.__gameTest;
}

test('los recursos mínimos de la PWA existen', () => {
  for (const file of ['index.html', 'manifest.webmanifest', 'service-worker.js', 'icons/icon-192.png', 'icons/icon-512.png']) {
    assert.ok(existsSync(resolve(root, file)), `Falta ${file}`);
  }
});

test('el manifiesto está bien formado y apunta a recursos existentes', () => {
  const manifest = JSON.parse(read('manifest.webmanifest'));
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.start_url, './');
  assert.equal(manifest.scope, './');
  assert.ok(Array.isArray(manifest.icons) && manifest.icons.length >= 2);
  for (const icon of manifest.icons) {
    assert.ok(existsSync(resolve(root, icon.src)), `Ícono inexistente: ${icon.src}`);
  }
});

test('el HTML mantiene las pantallas principales y JavaScript sintácticamente válido', () => {
  const html = read('index.html');
  for (const id of ['game', 'startOverlay', 'pauseOverlay', 'endOverlay', 'statsModal', 'startBtn']) {
    assert.match(html, new RegExp(`id=["']${id}["']`), `Falta ${id}`);
  }
  const scripts = [...html.matchAll(/<script[^>]*>([^]*?)<\/script>/gi)];
  assert.ok(scripts.length >= 1);
  for (const [, source] of scripts) new Script(source);
});

test('el service worker compila y cachea los recursos esperados', () => {
  const worker = read('service-worker.js');
  new Script(worker);
  for (const asset of ['./index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png']) {
    assert.ok(worker.includes(asset), `No se precachea ${asset}`);
  }
});

test('la cola de giros evita el reverso y conserva giros válidos', () => {
  const game = loadGame();
  game.start();

  game.direction('L');
  game.direction('U');
  game.direction('L');

  assert.equal(game.game.queue.length, 2);
  assert.equal(game.game.queue[0].y, -1);
  assert.equal(game.game.queue[1].x, -1);
});

test('el escudo absorbe una colisión sin mover la serpiente y admite un giro seguro', () => {
  const game = loadGame();
  game.start();
  const state = game.game;
  const head = { ...state.snake[0] };
  state.effects.shield = 1;
  state.obstacles = [{ x: head.x + 1, y: head.y }];

  game.tick();

  assert.equal(game.status, 'playing');
  assert.deepEqual({ ...state.snake[0] }, head);
  assert.equal(state.effects.shield, 0);
  assert.equal(state.freeze, 450);

  game.direction('U');
  state.freeze = 0;
  game.tick();
  assert.deepEqual({ ...state.snake[0] }, { x: head.x, y: head.y - 1 });
});

test('la transición de nivel conserva comida alcanzable y genera los obstáculos previstos', () => {
  const game = loadGame();
  game.start();
  const state = game.game;
  const head = state.snake[0];
  state.eaten = 7;
  state.food = { x: head.x + 1, y: head.y };

  game.tick();

  assert.equal(state.level, 2);
  assert.equal(state.obstacles.length, 10);
  assert.ok(state.food);
  assert.ok(game.reachable().has(`${state.food.x},${state.food.y}`));
});

test('los niveles con obstáculos reservan una celda libre y alcanzable para la comida', () => {
  const game = loadGame();
  game.start();
  const state = game.game;

  for (const [level, obstacleCount] of [[2, 10], [3, 20]]) {
    state.level = level;
    state.seeded = true;
    state.seed = level;
    state.food = null;
    state.item = null;
    game.makeObstacles();
    game.placeFood();

    assert.equal(state.obstacles.length, obstacleCount);
    assert.ok(state.food);
    assert.ok(game.reachable().has(`${state.food.x},${state.food.y}`));
  }
});

test('la pausa congela el temporizador del bonus y los efectos activos', () => {
  const game = loadGame();
  game.start();
  const state = game.game;
  state.item = { x: 0, y: 0, type: 'star', left: 7000 };
  state.effects.slow = 6500;
  state.effects.double = 6500;

  game.pause();
  game.loop(5000);

  assert.equal(game.status, 'paused');
  assert.equal(state.item.left, 7000);
  assert.equal(state.effects.slow, 6500);
  assert.equal(state.effects.double, 6500);
});


test('la bienvenida inhabilita controles ocultos y los restaura al jugar', () => {
  const game = loadGame();
  assert.ok(game.hiddenControls.every(node => node.inert));
  game.start();
  assert.ok(game.hiddenControls.every(node => !node.inert));
});

test('el ranking conserva el botón que lo abrió para devolver el foco', () => {
  const game = loadGame();
  let focused = 0;
  const button = {focus() { focused++; }, inert: false};
  game.openStats(button);
  game.closeStats();
  assert.equal(focused, 1);
});

test('el diálogo de ranking se muestra encima de la portada', () => {
  const html = read('index.html');
  assert.ok(html.includes('.modal{z-index:30}'));
  assert.ok(html.includes('.landing{position:fixed;inset:0;z-index:20;'));
});

test('el manual se abre desde la bienvenida, navega y devuelve el foco', () => {
  const game = loadGame();
  let focused = 0;
  const button = {focus() { focused++; }, inert: false};

  game.openManual(button);
  assert.equal(game.getElement('manualModal').classList.contains('hidden'), false);
  assert.equal(game.getElement('manualStep').textContent, 'Paso 1 de 4');
  game.getElement('nextManual').onclick();
  assert.equal(game.manualIndex, 1);
  assert.equal(game.getElement('manualStep').textContent, 'Paso 2 de 4');
  game.getElement('previousManual').onclick();
  assert.equal(game.manualIndex, 0);
  game.closeManual();
  assert.equal(game.getElement('manualModal').classList.contains('hidden'), true);
  assert.equal(focused, 1);
});

test('el manual atrapa Tab y Shift+Tab, bloquea el fondo y cierra con Escape', () => {
  const game = loadGame();
  let focused = 0;
  const trigger = {focus() { focused++; }, inert: false};
  game.openManual(trigger);
  const close = game.getElement('closeManual');
  const next = game.getElement('nextManual');
  const forward = {key: 'Tab', shiftKey: false, prevented: false, preventDefault() { this.prevented = true; }};
  game.dispatchKey(forward);
  assert.equal(forward.prevented, true);
  assert.equal(game.getElement('startOverlay').inert, true);
  assert.equal(game.getElement('manualModal').classList.contains('hidden'), false);
  assert.equal(game.activeElement, next);
  const backward = {key: 'Tab', shiftKey: true, prevented: false, preventDefault() { this.prevented = true; }};
  game.dispatchKey(backward);
  assert.equal(backward.prevented, true);
  assert.equal(game.activeElement, close);
  const escape = {key: 'Escape', preventDefault() {}};
  game.dispatchKey(escape);
  assert.equal(game.getElement('manualModal').classList.contains('hidden'), true);
  assert.equal(game.getElement('startOverlay').inert, false);
  assert.equal(focused, 1);
});

test('abrir y cerrar el manual no modifica la partida ni sus preferencias', () => {
  const game = loadGame();
  game.start();
  const state = game.game;
  game.getElement('touchMode').value = 'buttons';

  game.openManual();
  game.closeManual();

  assert.equal(game.status, 'playing');
  assert.equal(game.game, state);
  assert.equal(game.getElement('touchMode').value, 'buttons');
});

test('el manual documenta mecánicas actuales y tiene controles accesibles', () => {
  const html = read('index.html');
  for (const id of ['howToPlayBtn', 'manualModal', 'manualTitle', 'manualContent', 'previousManual', 'nextManual', 'closeManual']) {
    assert.match(html, new RegExp(`id=["']${id}["']`));
  }
  assert.ok(html.includes('protección de bienvenida durante 2 segundos'));
  assert.ok(html.includes('Flechas en pantalla'));
  assert.ok(html.includes('Desafío diario'));
});


test('los gestos continuos permiten encadenar giros sin levantar el dedo', () => {
  const game=loadGame();game.start();
  const canvas=game.getElement('game');
  canvas.dispatch('pointerdown',{pointerId:4,pointerType:'touch',clientX:100,clientY:100});
  canvas.dispatch('pointermove',{pointerId:4,pointerType:'touch',clientX:100,clientY:60});
  canvas.dispatch('pointermove',{pointerId:4,pointerType:'touch',clientX:55,clientY:60});
  assert.equal(game.game.queue.length,2);
  assert.equal(game.game.queue[0].y,-1);
  assert.equal(game.game.queue[1].x,-1);
  canvas.dispatch('pointerup',{pointerId:4,pointerType:'touch',clientX:55,clientY:60});
});

test('el control continuo ignora punteros ajenos y cancela correctamente', () => {
  const game=loadGame();game.start();
  const canvas=game.getElement('game');
  canvas.dispatch('pointerdown',{pointerId:1,pointerType:'touch',clientX:100,clientY:100});
  canvas.dispatch('pointermove',{pointerId:2,pointerType:'touch',clientX:100,clientY:40});
  assert.equal(game.game.queue.length,0);
  canvas.dispatch('pointercancel',{pointerId:1});
  canvas.dispatch('pointermove',{pointerId:1,pointerType:'touch',clientX:100,clientY:40});
  assert.equal(game.game.queue.length,0);
});

test('las flechas permanecen disponibles como alternativa al control por gestos', () => {
  const game=loadGame();game.start();
  game.getElement('touchMode').value='buttons';
  const canvas=game.getElement('game');
  canvas.dispatch('pointerdown',{pointerId:1,pointerType:'touch',clientX:100,clientY:100});
  canvas.dispatch('pointermove',{pointerId:1,pointerType:'touch',clientX:100,clientY:50});
  assert.equal(game.game.queue.length,0);
  game.direction('U');
  assert.equal(game.game.queue.length,1);
});


test('el arrastre largo en la misma dirección no bloquea un giro posterior', () => {
  const game=loadGame();game.start();
  const canvas=game.getElement('game');
  canvas.dispatch('pointerdown',{pointerId:8,pointerType:'touch',clientX:100,clientY:200});
  canvas.dispatch('pointermove',{pointerId:8,pointerType:'touch',clientX:100,clientY:150});
  canvas.dispatch('pointermove',{pointerId:8,pointerType:'touch',clientX:100,clientY:90});
  canvas.dispatch('pointermove',{pointerId:8,pointerType:'touch',clientX:70,clientY:90});
  assert.equal(game.game.queue.length,2);
  assert.equal(game.game.queue[0].y,-1);
  assert.equal(game.game.queue[1].x,-1);
});

test('la portada incluye el selector táctil en los controles inertes', () => {
  const html=read('index.html');
  assert.ok(html.includes('.pad, .hint, .touch-setting'));
});


test('el nivel 2 se inicia automáticamente con protección de dos segundos', () => {
  const sim=loadGame();sim.start();const g=sim.game;
  g.snake=[{x:18,y:12},{x:17,y:12},{x:16,y:12}];
  g.dir={x:1,y:0};g.eaten=7;g.food={x:19,y:12};
  sim.tick();
  assert.equal(g.level,2);
  assert.equal(sim.status,'playing');
  assert.equal(g.levelGrace,2000);
  assert.equal(g.snake[0].x,19);
  assert.ok(g.food);
  assert.notDeepEqual({...g.food},{...g.snake[0]});
  sim.tick();
  assert.equal(sim.status,'playing');
  assert.equal(g.rescue,true);
  assert.equal(g.snake[0].x,19,'la protección no atraviesa la pared');
  sim.tick();
  assert.equal(g.snake[0].x,19,'no sigue moviéndose contra la pared');
  sim.direction('D');
  assert.equal(g.rescue,false);
  sim.tick();
  assert.equal(sim.status,'playing');
  assert.equal(g.snake[0].y,13);
});

test('el paso de nivel descarta giros viejos y genera una fruta nueva', () => {
  const sim=loadGame();sim.start();const g=sim.game;
  g.eaten=7;g.snake=[{x:18,y:12},{x:17,y:12},{x:16,y:12}];g.dir={x:1,y:0};
  g.queue=[{x:0,y:-1},{x:1,y:0}];g.food={x:18,y:11};
  sim.tick();
  assert.equal(sim.status,'playing');
  assert.equal(g.queue.length,0);
  assert.ok(g.food);
  assert.notDeepEqual({...g.food},{...g.snake[0]});
});

test('la protección se consume solo mientras se avanza y finaliza', () => {
  const sim=loadGame();sim.start();const g=sim.game;
  g.eaten=7;g.food={x:11,y:12};
  sim.tick();
  assert.equal(g.levelGrace,2000);
  g.freeze=0;
  sim.loop(1000);
  assert.ok(g.levelGrace<2000);
  g.rescue=true;
  const remaining=g.levelGrace;
  sim.loop(1100);
  assert.equal(g.levelGrace,remaining);
});

test('los controles de rumbo permanecen ocultos fuera de la transición', () => {
  const html=read('index.html');
  assert.ok(html.includes('#levelDirections.hidden{display:none}'));
});

test('solo la zona de gestos impide el paneo; el aviso conserva scroll', () => {
  const html=read('index.html');
  assert.ok(html.includes('#levelGesture{touch-action:none;'));
  assert.ok(!html.includes('#pauseOverlay:has(#levelDirections:not(.hidden)){touch-action:none}'));
  assert.ok(html.includes("el('levelGesture').addEventListener('pointerdown'"));
});
