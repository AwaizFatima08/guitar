// Usage: python3 -m http.server 8799 --directory app --bind 127.0.0.1 &  and  google-chrome --headless=new --remote-debugging-port=9555 --user-data-dir=/tmp/geetar-shots about:blank &  then  node scripts/store-screenshots.mjs
// Capture Play Store phone screenshots (1080x1920) of the Geetar web app through Chrome DevTools.
import { writeFileSync } from 'node:fs';
const OUT = '/mnt/storage/projects/guitar/store-assets/phone';
const list = await (await fetch('http://localhost:9555/json')).json();
const page = list.find((p) => p.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
let id = 0; const pending = new Map();
ws.addEventListener('message', (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); } });
const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const evalJs = async (expression) => (await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result?.result?.value;
await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 360, height: 640, deviceScaleFactor: 3, mobile: true });
await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'light' }] });
await send('Page.navigate', { url: 'http://127.0.0.1:8799/' });
await wait(2500);
const today = await evalJs(`(()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')})()`);
await evalJs(`localStorage.clear(); 1`); await send('Page.reload', { ignoreCache: true }); await wait(2500); await evalJs(`document.activeElement && document.activeElement.blur(); window.scrollTo(0,0); 1`); await wait(500);
{ const r = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(`${OUT}/0-welcome.png`, Buffer.from(r.result.data, 'base64')); console.log('saved 0-welcome'); }
const state = { name: 'Pari', onboarded: true, goal: 10, theme: 'light', done: { b1: today, b2: today, b3: today }, checks: {}, best: { 'Am-Em': 18 }, history: {}, days: { [today]: { secs: 420, acts: 5 } }, timerStart: null };
await evalJs(`localStorage.setItem('geetar.v1', ${JSON.stringify(JSON.stringify(state))}); (async()=>{for (const r of await navigator.serviceWorker.getRegistrations()) await r.unregister();})()`);
const shot = async (name, hash, prep = '') => {
  await evalJs(`location.hash = ${JSON.stringify(hash)}; window.scrollTo(0,0); 1`);
  await wait(1800);
  if (prep) { await evalJs(prep); await wait(1500); }
  const r = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(`${OUT}/${name}.png`, Buffer.from(r.result.data, 'base64'));
  console.log('saved', name);
};
await send('Page.reload', { ignoreCache: true });
await wait(3000);
await shot('1-home', '#/');
await shot('2-tuner', '#/tuner', `(async()=>{ const AC=window.AudioContext; const c=new AC(); const o=c.createOscillator(), o2=c.createOscillator(), g=c.createGain(); g.gain.value=0.4; o.frequency.value=110*Math.pow(2,-2/1200); o2.frequency.value=o.frequency.value*2; o2.connect(g); const d=c.createMediaStreamDestination(); o.connect(d); g.connect(d); o.start(); o2.start(); navigator.mediaDevices.getUserMedia=async()=>d.stream; document.querySelector('.tn-card .btn-primary').click(); await new Promise(r=>setTimeout(r,2500)); window.scrollTo(0,0); })()`);
await shot('3-lessons', '#/learn');
await shot('4-lesson-em', '#/lesson/b8', `(()=>{ window.scrollTo(0, 60); })()`);
await shot('5-chords', '#/chords');
await shot('6-song', '#/song/mary', `(async()=>{ document.querySelector('.song .btn-primary').click(); await new Promise(r=>setTimeout(r,4800)); })()`);
await shot('7-guitar-parts', '#/lesson/b1', `(()=>{ document.querySelector('.figure').scrollIntoView({block:'start'}); window.scrollBy(0,-70); })()`);
await shot('8-practice', '#/practice');
ws.close();
