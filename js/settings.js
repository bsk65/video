// js/settings.js — Indstillinger (optagelængde/afspilningsforsinkelse):
// load/save mod localStorage. Ingen DOM her.

import { state } from './state.js'

const STORAGE_KEY = 'skydevideo_settings'
export const DEFAULT_RECORD_SECONDS = 10
export const DEFAULT_PLAYBACK_DELAY = 2

export function loadSettings() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    state.settings = {
      recordSeconds: Number(raw.recordSeconds) || DEFAULT_RECORD_SECONDS,
      playbackDelay: raw.playbackDelay != null ? Number(raw.playbackDelay) : DEFAULT_PLAYBACK_DELAY
    }
  } catch {
    state.settings = { recordSeconds: DEFAULT_RECORD_SECONDS, playbackDelay: DEFAULT_PLAYBACK_DELAY }
  }
}

export function saveSettings(next) {
  state.settings = next
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
}
