// js/ui.js — DOM-elementer, skærm-skift og sammenkobling af de rene moduler
// (camera.js/recorder.js/settings.js/countdown.js) til den faktiske flow:
// kamera → nedtælling → optagelse → pause → afspilning.

import { state } from './state.js'
import { loadSettings, saveSettings, DEFAULT_RECORD_SECONDS, DEFAULT_PLAYBACK_DELAY, SPEED_PRESETS } from './settings.js'
import { startCamera, applySpeedToCamera } from './camera.js'
import { runCountdown } from './countdown.js'
import { recordClip, extFor } from './recorder.js'

const COUNTDOWN_SECONDS = 3

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
  speedSelect: document.getElementById('speed-select'),
  playbackWaitOverlay: document.getElementById('playback-wait-overlay'),
  playbackWaitNum: document.getElementById('playback-wait-num'),
  recordAgainBtn: document.getElementById('record-again-btn'),
  downloadBtn: document.getElementById('download-btn')
}

function showScreen(name) {
  els.cameraScreen.classList.toggle('active', name === 'camera')
  els.playbackScreen.classList.toggle('active', name === 'playback')
}

async function ensureCamera() {
  if (state.stream) return true
  const ok = await startCamera(els.preview)
  els.permissionMsg.classList.toggle('hidden', ok)
  return ok
}

async function beginRecordFlow() {
  if (!(await ensureCamera())) return
  els.recordBtn.disabled = true
  await runCountdown(els.countdownOverlay, els.countdownNum, COUNTDOWN_SECONDS)
  els.recBadge.classList.remove('hidden')

  recordClip(
    remaining => { els.recTime.textContent = remaining },
    blobUrl => onRecordingStopped(blobUrl)
  )
}

async function onRecordingStopped(blobUrl) {
  els.recBadge.classList.add('hidden')
  els.recordBtn.disabled = false
  showScreen('playback')
  els.playback.src = blobUrl
  els.playback.playbackRate = SPEED_PRESETS[state.settings.speed]?.playbackRate || 1

  if (state.settings.playbackDelay > 0) {
    await runCountdown(els.playbackWaitOverlay, els.playbackWaitNum, state.settings.playbackDelay)
  }
  els.playback.currentTime = 0
  els.playback.playbackRate = SPEED_PRESETS[state.settings.speed]?.playbackRate || 1
  els.playback.play().catch(() => {})
}

function wireEvents() {
  els.recordBtn.addEventListener('click', beginRecordFlow)
  els.retryCameraBtn.addEventListener('click', ensureCamera)

  els.recordAgainBtn.addEventListener('click', () => {
    els.playback.pause()
    showScreen('camera')
  })

  els.downloadBtn.addEventListener('click', () => {
    if (!state.lastBlobUrl) return
    const a = document.createElement('a')
    a.href = state.lastBlobUrl
    a.download = `skydevideo-${Date.now()}.${extFor(state.recordedMimeType)}`
    document.body.appendChild(a)
    a.click()
    a.remove()
  })

  els.settingsBtn.addEventListener('click', () => {
    els.recordSecondsInput.value = state.settings.recordSeconds
    els.playbackDelayInput.value = state.settings.playbackDelay
    els.speedSelect.value = state.settings.speed
    els.settingsOverlay.classList.remove('hidden')
  })
  els.settingsCloseBtn.addEventListener('click', () => {
    const recordSeconds = Math.min(60, Math.max(1, Number(els.recordSecondsInput.value) || DEFAULT_RECORD_SECONDS))
    const playbackDelay = Math.min(30, Math.max(0, Number(els.playbackDelayInput.value) || DEFAULT_PLAYBACK_DELAY))
    const speed = SPEED_PRESETS[els.speedSelect.value] ? els.speedSelect.value : 'normal'
    const speedChanged = speed !== state.settings.speed
    saveSettings({ recordSeconds, playbackDelay, speed })
    els.settingsOverlay.classList.add('hidden')
    if (speedChanged) applySpeedToCamera()
  })
}

export function initUI() {
  loadSettings()
  wireEvents()
  ensureCamera()
}
