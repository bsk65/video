// js/recorder.js — Ren MediaRecorder-logik: vælger understøttet mimeType,
// styrer selve optagelsen og pakker resultatet i en blob-URL. Ingen DOM her
// udover de callbacks der kaldes med (onTick/onStop) — skærm-styring hører
// til i ui.js.

import { state } from './state.js'

function pickMimeType() {
  const candidates = [
    'video/mp4;codecs=h264',
    'video/mp4',
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm'
  ]
  return candidates.find(c => window.MediaRecorder && MediaRecorder.isTypeSupported(c)) || ''
}

export function extFor(mime) { return mime.includes('mp4') ? 'mp4' : 'webm' }

// onTick(remainingSeconds) kaldes hvert sekund. onStop(blobUrl) kaldes når
// optagelsen er stoppet (efter varigheden er gået, eller ved fejl).
export function recordClip(onTick, onStop) {
  state.chunks = []
  const mimeType = pickMimeType()
  try {
    state.recorder = mimeType ? new MediaRecorder(state.stream, { mimeType }) : new MediaRecorder(state.stream)
  } catch {
    state.recorder = new MediaRecorder(state.stream)
  }
  state.recordedMimeType = state.recorder.mimeType || mimeType || 'video/webm'

  state.recorder.ondataavailable = e => { if (e.data && e.data.size) state.chunks.push(e.data) }
  state.recorder.onstop = () => {
    const blob = new Blob(state.chunks, { type: state.recordedMimeType })
    if (state.lastBlobUrl) URL.revokeObjectURL(state.lastBlobUrl)
    state.lastBlobUrl = URL.createObjectURL(blob)
    onStop(state.lastBlobUrl)
  }

  state.recorder.start()
  let remaining = state.settings.recordSeconds
  onTick(remaining)
  const tick = setInterval(() => {
    remaining--
    onTick(Math.max(remaining, 0))
    if (remaining <= 0) clearInterval(tick)
  }, 1000)

  setTimeout(() => {
    clearInterval(tick)
    if (state.recorder.state !== 'inactive') state.recorder.stop()
  }, state.settings.recordSeconds * 1000)
}
