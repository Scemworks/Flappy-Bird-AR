'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type Pipe = { x: number; top: number; bottom: number; passed: boolean };
type GameState = { y: number; vy: number; target: number; pipes: Pipe[]; score: number; best: number; alive: boolean; started: boolean; last: number; nextPipe: number };
type DetectedFace = { boundingBox: { y: number; height: number } };
type FaceDetectorInstance = { detect: (source: HTMLVideoElement) => Promise<DetectedFace[]> };
type FaceDetectorConstructor = new (options: { fastMode: boolean; maxDetectedFaces: number }) => FaceDetectorInstance;
type FaceDetectorWindow = Window & typeof globalThis & { FaceDetector?: FaceDetectorConstructor };

const clamp = (number: number, min: number, max: number) => Math.max(min, Math.min(max, number));

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const gameRef = useRef<GameState>({ y: .5, vy: 0, target: .5, pipes: [], score: 0, best: 0, alive: false, started: false, last: 0, nextPipe: 0 });
  const [camera, setCamera] = useState(false);
  const [status, setStatus] = useState('Camera is off');
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [tips, setTips] = useState(true);

  const startGame = useCallback(() => {
    const g = gameRef.current;
    g.y = .5; g.vy = 0; g.target = .5; g.pipes = []; g.score = 0; g.alive = true; g.started = true; g.nextPipe = 0;
    setScore(0); setTips(false);
  }, []);

  const connectCamera = useCallback(async () => {
    if (streamRef.current) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus('Camera unavailable · Use touch or mouse to fly');
      return;
    }
    try {
      setStatus('Requesting camera…');
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
      streamRef.current = stream;
      if (!videoRef.current) return;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setCamera(true); setStatus('Camera connected · Nose tracking active');
    } catch (error) {
      setStatus('Camera unavailable · Use touch or mouse to fly');
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const resize = () => { canvas.width = canvas.clientWidth * devicePixelRatio; canvas.height = canvas.clientHeight * devicePixelRatio; ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0); };
    resize(); window.addEventListener('resize', resize);
    const move = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      gameRef.current.target = clamp((event.clientY - rect.top) / rect.height, .08, .92);
    };
    const startFromPointer = (event: PointerEvent) => { move(event); if (!gameRef.current.alive) startGame(); };
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerdown', startFromPointer);

    const draw = (now: number) => {
      const w = canvas.clientWidth, h = canvas.clientHeight, g = gameRef.current;
      const dt = Math.min((now - (g.last || now)) / 1000, .05); g.last = now;
      if (g.alive) {
        g.vy += (g.target - g.y) * 7 * dt; g.vy *= .88; g.y += g.vy * dt;
        g.nextPipe -= dt;
        if (g.nextPipe <= 0) { const gap = .31; const center = .27 + Math.random() * .46; g.pipes.push({ x: 1.08, top: center-gap/2, bottom: center+gap/2, passed: false }); g.nextPipe = 1.75; }
        g.pipes.forEach(p => { p.x -= .31 * dt; if (!p.passed && p.x < .39) { p.passed = true; g.score++; setScore(g.score); } });
        g.pipes = g.pipes.filter(p => p.x > -.15);
        const hit = g.y < .055 || g.y > .945 || g.pipes.some(p => p.x < .48 && p.x + .13 > .34 && (g.y < p.top || g.y > p.bottom));
        if (hit) { g.alive = false; const newBest = Math.max(g.best, g.score); g.best = newBest; setBest(newBest); setStatus('Flight ended · Tap to try again'); }
      }
      ctx.clearRect(0, 0, w, h);
      // warm vignette and horizon
      const gradient = ctx.createLinearGradient(0, 0, 0, h); gradient.addColorStop(0, 'rgba(24,70,119,.16)'); gradient.addColorStop(1, 'rgba(2,13,32,.48)'); ctx.fillStyle = gradient; ctx.fillRect(0,0,w,h);
      // pipes
      g.pipes.forEach(p => { const x = p.x*w, pw = .13*w; ctx.fillStyle='#c9f26c'; ctx.fillRect(x,0,pw,p.top*h); ctx.fillRect(x,p.bottom*h,pw,(1-p.bottom)*h); ctx.fillStyle='#83bf3a'; ctx.fillRect(x+pw*.72,0,pw*.28,p.top*h); ctx.fillRect(x+pw*.72,p.bottom*h,pw*.28,(1-p.bottom)*h); ctx.fillStyle='#e4ff9e'; ctx.fillRect(x-pw*.08,p.top*h-9,pw*1.16,9); ctx.fillRect(x-pw*.08,p.bottom*h,pw*1.16,9); });
      // bird
      const bx = w*.39, by = g.y*h, r = Math.max(16, Math.min(w,h)*.043); ctx.save(); ctx.translate(bx,by); ctx.rotate(clamp(g.vy*2,-.35,.35));
      ctx.fillStyle='#ffd252'; ctx.beginPath(); ctx.ellipse(0,0,r*1.15,r*.88,0,0,Math.PI*2); ctx.fill(); ctx.fillStyle='#fff3b0'; ctx.beginPath(); ctx.ellipse(-r*.22,r*.21,r*.52,r*.35,.25,0,Math.PI*2); ctx.fill(); ctx.fillStyle='#ee7f39'; ctx.beginPath(); ctx.moveTo(r*.82,0);ctx.lineTo(r*1.42,r*.2);ctx.lineTo(r*.82,r*.38);ctx.fill(); ctx.fillStyle='#182742'; ctx.beginPath();ctx.arc(r*.32,-r*.25,r*.12,0,Math.PI*2);ctx.fill(); ctx.restore();
      requestRef.current = requestAnimationFrame(draw);
    };
    requestRef.current = requestAnimationFrame(draw);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); window.removeEventListener('resize', resize); canvas.removeEventListener('pointermove', move); canvas.removeEventListener('pointerdown', startFromPointer); };
  }, [startGame]);

  useEffect(() => {
    // FaceDetector is a progressive enhancement. It keeps the game functional on every PWA-capable device.
    let timer: ReturnType<typeof window.setTimeout>;
    const FaceDetector = (window as FaceDetectorWindow).FaceDetector;
    const detector = camera && FaceDetector ? new FaceDetector({ fastMode: true, maxDetectedFaces: 1 }) : null;
    const track = async () => {
      if (detector && videoRef.current && videoRef.current.readyState >= 2) {
        try { const faces = await detector.detect(videoRef.current); if (faces[0]) { const box = faces[0].boundingBox; gameRef.current.target = clamp((box.y + box.height * .57) / videoRef.current.videoHeight, .08, .92); } } catch (_) {}
      }
      timer = window.setTimeout(track, 90);
    };
    track(); return () => window.clearTimeout(timer);
  }, [camera]);

  useEffect(() => { if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js'); return () => streamRef.current?.getTracks().forEach((track: MediaStreamTrack) => track.stop()); }, []);

  return <main>
    <video ref={videoRef} className="camera" playsInline muted aria-hidden="true" />
    <div className="cameraShade" />
    <nav><div className="brand"><span className="brandMark">F</span><span>Flappy Bird AR</span></div><div className="navPill"><span className={camera ? 'dot on' : 'dot'} /> {camera ? 'LIVE CAMERA' : 'CAMERA READY'}</div><button className="iconButton" aria-label="How to play" onClick={() => setTips(!tips)}>?</button></nav>
    <section className="hero"><div><p className="eyebrow">FACE CONTROLLED FLIGHT</p><h1>Fly with<br/><em>your face.</em></h1><p className="intro">Your nose is the joystick. Move it up and down to guide your bird through the wild.</p></div><div className="scoreCard"><span>FLIGHT SCORE</span><strong>{String(score).padStart(2,'0')}</strong><small>BEST <b>{String(best).padStart(2,'0')}</b></small></div></section>
    <section className="gameShell"><canvas ref={canvasRef} className="game" aria-label="Flappy Bird AR game board" /><div className="gameTop"><span className="status"><i className={camera ? 'dot on' : 'dot'} />{status}</span><button className="reset" onClick={startGame}>↻ Restart</button></div>{!gameRef.current.alive && <div className="gamePrompt"><span className="wing">◒</span><h2>{gameRef.current.started ? 'Ready for another flight?' : 'Ready to take flight?'}</h2><p>Move your nose to steer</p><button onClick={startGame}>{gameRef.current.started ? 'Fly again' : 'Start flying'} <b>→</b></button></div>}</section>
    <section className="bottom"><button className="cameraButton" onClick={connectCamera}>{camera ? '✓ Camera connected' : '⌁  Enable camera'}</button><p>For the best flight, keep your face centered and well lit.</p><div className="steps"><span><b>01</b> Enable camera</span><i>—</i><span><b>02</b> Move your nose</span><i>—</i><span><b>03</b> Stay airborne</span></div></section>
    {tips && <aside className="tip"><button onClick={() => setTips(false)}>×</button><b>How it works</b><p>We use on-device face detection where your browser supports it. Your video never leaves this device.</p></aside>}
  </main>;
}
