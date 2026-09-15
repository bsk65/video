// js/camera.js — Ren kamera-adgang: åbner frontkameraet og binder streamen
// til preview-elementet. Ingen andre moduler kalder getUserMedia direkte.

import { state } from './state.js'

export async function startCamera(previewEl) {
  try {
    state.stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
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
