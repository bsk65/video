// js/camera.js — Ren kamera-adgang: åbner frontkameraet og binder streamen
// til preview-elementet. Ingen andre moduler kalder getUserMedia direkte.

import { state } from './state.js'
import { SPEED_PRESETS } from './settings.js'

export async function startCamera(previewEl) {
  const frameRate = SPEED_PRESETS[state.settings.speed]?.frameRate
  try {
    state.stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'user',
        width: { ideal: 1280 },
        height: { ideal: 720 },
        ...(frameRate ? { frameRate: { ideal: frameRate } } : {})
      },
      audio: true
    })
  } catch {
    try {
      state.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
    } catch {
      state.stream = null
      return false
    }
  }
  previewEl.srcObject = state.stream
  return true
}

// Forsøger at skifte kameraets billedrate uden at genstarte streamen (så
// preview ikke blinker). Fejler stille hvis kameraet ikke understøtter det
// ønskede — den faktiske optagelse bruger da bare den billedrate kameraet
// allerede kører med.
export async function applySpeedToCamera() {
  const track = state.stream?.getVideoTracks?.()[0]
  const frameRate = SPEED_PRESETS[state.settings.speed]?.frameRate
  if (!track || !frameRate) return
  try {
    await track.applyConstraints({ frameRate: { ideal: frameRate } })
  } catch {
    // Kameraet understøtter ikke den ønskede billedrate — ignorér.
  }
}
