# Flappy Bird AR

A camera-background, face-controlled Flappy Bird-style game built with Next.js. On supported browsers, on-device face detection maps the player's nose region to the bird's vertical movement. Mouse and touch controls remain available if a camera or face detection is unavailable.

## Run locally

```bash
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000), select **Enable camera**, and then choose **Start flying**. Camera access requires a secure context (HTTPS) or localhost.

## Quality checks

```bash
npm test
npm run typecheck
npm run build
```

## Deploy to Vercel

This repository is configured for Vercel's Next.js framework detection. Import the repository at [vercel.com/new](https://vercel.com/new), keep the default project settings, and deploy. Vercel runs `npm run build` as configured in `vercel.json`.

The application uses `output: 'export'`, so the generated static site is emitted to `out/`. Camera access works on the Vercel HTTPS deployment. Once the service worker has installed and cached the app shell, the installed PWA can be played offline.

## Browser support

- Camera: any modern browser with `getUserMedia` support.
- Face controls: browsers that expose the native `FaceDetector` API.
- Fallback controls: mouse or touch input, available in every supported browser.
