// Geetar: microphone input for the tuner and "listen" mode.
import { audioCtx } from './audio.js';

let stream = null, source = null, analyser = null, timer = null;

export function micSupported() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

/** Start the microphone. onFrame(Float32Array, sampleRate) is called about 15 times a second. */
export async function startMic(onFrame) {
  stopMic();
  if (!window.isSecureContext) throw new Error('insecure');
  if (!micSupported()) throw new Error('unsupported');
  const c = audioCtx();
  stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
  });
  source = c.createMediaStreamSource(stream);
  analyser = c.createAnalyser();
  analyser.fftSize = 4096;
  source.connect(analyser);
  const buf = new Float32Array(analyser.fftSize);
  timer = setInterval(() => {
    analyser.getFloatTimeDomainData(buf);
    onFrame(buf, c.sampleRate);
  }, 66);
}

export function stopMic() {
  if (timer) clearInterval(timer);
  timer = null;
  if (source) source.disconnect();
  if (stream) stream.getTracks().forEach((t) => t.stop());
  stream = null; source = null; analyser = null;
}

export const micRunning = () => !!stream;

export function micErrorText(err) {
  const m = String(err && (err.name || err.message || err));
  if (m.includes('insecure')) return 'The microphone only works when the app is opened over https:// (or on this computer). Open the app from its web address.';
  if (m.includes('unsupported')) return 'This browser cannot use the microphone. Try Chrome, Edge, Safari or Firefox.';
  if (m.includes('NotAllowed') || m.includes('Permission')) return location.hostname === '127.0.0.1' ? 'The microphone is switched off for Geetar. Allow it in your phone’s Settings → Apps → Geetar → Permissions, then press Start again.' : 'The microphone was blocked. Allow it in your browser’s site settings (the lock icon next to the address), then press Start again.';
  if (m.includes('NotFound')) return 'No microphone was found on this device.';
  return 'The microphone could not start: ' + m;
}
