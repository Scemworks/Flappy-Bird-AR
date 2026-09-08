import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const page = await readFile(new URL('../app/page.js', import.meta.url), 'utf8');
const css = await readFile(new URL('../app/globals.css', import.meta.url), 'utf8');
const worker = await readFile(new URL('../public/sw.js', import.meta.url), 'utf8');
const manifest = JSON.parse(await readFile(new URL('../public/manifest.webmanifest', import.meta.url), 'utf8'));

assert.match(page, /getUserMedia/, 'camera permission flow must be present');
assert.match(page, /FaceDetector/, 'face tracking enhancement must be present');
assert.match(page, /pointerdown/, 'touch and mouse fallback must be present');
assert.match(page, /getTracks\(\)\.forEach/, 'camera tracks must stop on unmount');
assert.match(page, /const hit =/, 'collision detection must be present');
assert.match(css, /@media\(max-width:700px\)/, 'mobile responsive layout must be present');
assert.equal(manifest.display, 'standalone', 'PWA must open standalone');
assert.equal(manifest.start_url, '/', 'PWA must have an app start route');
assert.ok(manifest.icons?.length, 'PWA must define an icon');
assert.match(worker, /self\.addEventListener\('install'/, 'service worker must install');
assert.match(worker, /caches\.match/, 'service worker must serve cached responses');
console.log('Flappy Bird AR static functional checks passed.');
