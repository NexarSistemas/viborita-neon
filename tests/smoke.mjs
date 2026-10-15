import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Script } from 'node:vm';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (name) => readFileSync(resolve(root, name), 'utf8');

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
  const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)];
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
