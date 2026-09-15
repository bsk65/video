// js/main.js — Skydevideo: åbner frontkamera, optager i N sekunder, og
// afspiller optagelsen automatisk igen efter en kort pause. Ingen backend —
// alt foregår i browseren, og optagelsen forlader aldrig telefonen medmindre
// brugeren selv trykker "Download".

const COUNTDOWN_SECONDS = 3
const DEFAULT_RECORD_SECONDS = 10
const DEFAULT_PLAYBACK_DELAY = 2
const STORAGE_KEY = 'skydevideo_settings'

const els = {
  cameraScreen: document.getElementById('camera-screen'),
  playbackScreen: document.getElementById('playback-screen'),
  preview: document.getElementById('preview'),
  playback: document.getElementById('playback'),
  permissionMsg: document.getElementById('permission-msg'),
  retryCameraBtn: document.getElementById('retry-camera-btn'),
  countdownOverlay: document.getElementById('countdown-overlay'),
  countdownNum: document.getElementById('countdown-num'),
  recBadge: document.getElementById('rec-badge'),
  recTime: document.getElementById('rec-time'),
  recordBtn: document.getElementById('record-btn'),
  settingsBtn: document.getElementById('settings-btn'),
  settingsOverlay: document.getElementById('settings-overlay'),
  settingsCloseBtn: document.getElementById('settings-close-btn'),
  recordSecondsInput: document.getElementById('record-seconds-input'),
  playbackDelayInput: document.getElementById('playback-delay-input'),
  playbackWaitOverlay: document.getElementById('playback-wait-overlay'),
  playbackWaitNum: document.getElementById('playback-wait-num'),
  recordAgainBtn: document.getElementById('record-again-btn'),
  downloadBtn: document.getElementById('download-btn')
}

function loadSettings() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    return {
      recordSeconds: Number(raw.recordSeconds) || DEFAULT_RECORD_SECONDS,
      playbackDelay: raw.playbackDelay != null ? Number(raw.playbackDelay) : DEFAULT_PLAYBACK_DELAY
    }
  } catch {
    return { recordSeconds: DEFAULT_RECORD_SECONDS, playbackDelay: DEFAULT_PLAYBACK_DELAY }
  }
}
function saveSettings(s) { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)) }

let settings = loadSettings()
let stream = null
let recorder = null
let chunks = []
let lastBlobUrl = null
let recordedMimeType = 'video/webm'

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

async function startCamera() {
  els.permissionMsg.classList.add('hidden')
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: true
    })
  } catch {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
    } catch {
      els.permissionMsg.classList.remove('hidden')
      return
    }
  }
  els.preview.srcObject = stream
}

function showScreen(name) {
  els.cameraScreen.classList.toggle('active', name === 'camera')
  els.playbackScreen.classList.toggle('active', name === 'playback')
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function runCountdown(el, numEl, seconds) {
  el.classList.remove('hidden')
  for (let n = seconds; n >= 1; n--) {
    numEl.textContent = n
    await sleep(1000)
  }
  el.classList.add('hidden')
}

async function beginRecordFlow() {
  if (!stream) { await startCamera(); if (!stream) return }
  els.recordBtn.disabled = true
  await runCountdown(els.countdownOverlay, els.countdownNum, COUNTDOWN_SECONDS)
  recordClip()
}

function recordClip() {
  chunks = []
  recordedMimeType = pickMimeType()
  try {
    recorder = recordedMimeType
      ? new MediaRecorder(stream, { mimeType: recordedMimeType })
      : new MediaRecorder(stream)
  } catch {
    recorder = new MediaRecorder(stream)
    recordedMimeType = recorder.mimeType || 'video/webm'
  }

  recorder.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data) }
  recorder.onstop = onRecordingStopped

  recorder.start()
  els.recBadge.classList.remove('hidden')
  let remaining = settings.recordSeconds
  els.recTime.textContent = remaining
  const tick = setInterval(() => {
    remaining--
    els.recTime.textContent = Math.max(remaining, 0)
    if (remaining <= 0) clearInterval(tick)
  }, 1000)

  setTimeout(() => {
    clearInterval(tick)
    if (recorder.state !== 'inactive') recorder.stop()
  }, settings.recordSeconds * 1000)
}

async function onRecordingStopped() {
  els.recBadge.classList.add('hidden')
  els.recordBtn.disabled = false
  const blob = new Blob(chunks, { type: recordedMimeType || 'video/webm' })
  if (lastBlobUrl) URL.revokeObjectURL(lastBlobUrl)
  lastBlobUrl = URL.createObjectURL(blob)

  showScreen('playback')
  els.playback.src = lastBlobUrl

  if (settings.playbackDelay > 0) {
    await runCountdown(els.playbackWaitOverlay, els.playbackWaitNum, settings.playbackDelay)
  }
  els.playback.currentTime = 0
  els.playback.play().catch(() => {})
}

function extFor(mime) {
  if (mime.includes('mp4')) return 'mp4'
  return 'webm'
}

els.recordBtn.addEventListener('click', beginRecordFlow)
els.retryCameraBtn.addEventListener('click', startCamera)

els.recordAgainBtn.addEventListener('click', () => {
  els.playback.pause()
  showScreen('camera')
})

els.downloadBtn.addEventListener('click', () => {
  if (!lastBlobUrl) return
  const a = document.createElement('a')
  a.href = lastBlobUrl
  a.download = `skydevideo-${Date.now()}.${extFor(recordedMimeType)}`
  document.body.appendChild(a)
  a.click()
  a.remove()
})

els.settingsBtn.addEventListener('click', () => {
  els.recordSecondsInput.value = settings.recordSeconds
  els.playbackDelayInput.value = settings.playbackDelay
  els.settingsOverlay.classList.remove('hidden')
})
els.settingsCloseBtn.addEventListener('click', () => {
  const recordSeconds = Math.min(60, Math.max(1, Number(els.recordSecondsInput.value) || DEFAULT_RECORD_SECONDS))
  const playbackDelay = Math.min(30, Math.max(0, Number(els.playbackDelayInput.value) || 0))
  settings = { recordSeconds, playbackDelay }
  saveSettings(settings)
  els.settingsOverlay.classList.add('hidden')
})

startCamera()
