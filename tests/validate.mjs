import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';

const page = await readFile(new URL('../app/page.tsx', import.meta.url), 'utf8');
const css = await readFile(new URL('../app/globals.css', import.meta.url), 'utf8');
const worker = await readFile(new URL('../public/sw.js', import.meta.url), 'utf8');
const vercelConfig = JSON.parse(await readFile(new URL('../vercel.json', import.meta.url), 'utf8'));
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
assert.equal(vercelConfig.framework, 'nextjs', 'Vercel must detect the Next.js framework');
assert.equal(vercelConfig.buildCommand, 'npm run build', 'Vercel must use the project build command');
await Promise.all(['../app/layout.tsx', '../app/page.tsx', '../next.config.js', '../tsconfig.json', '../next-env.d.ts'].map(file => access(new URL(file, import.meta.url))));
console.log('Flappy Bird AR static functional checks passed.');
