// js/settings.js — Indstillinger (optagelængde/afspilningsforsinkelse):
// load/save mod localStorage. Ingen DOM her.

import { state } from './state.js'

const STORAGE_KEY = 'skydevideo_settings'
export const DEFAULT_RECORD_SECONDS = 10
export const DEFAULT_PLAYBACK_DELAY = 2
export const DEFAULT_SPEED = 'normal'

// Kamerabilledrate der forsøges bedt om pr. hastighed, og hvor meget
// afspilningen efterfølgende sænkes med i appen. Frontkameraet understøtter
// ofte ikke de høje billedrater — camera.js falder da tilbage til hvad
// kameraet reelt kan levere, og afspilningen bliver blot langsommere uden
// at være "ægte" slow motion.
export const SPEED_PRESETS = {
  normal: { label: 'Normal', frameRate: null, playbackRate: 1 },
  slow: { label: 'Slow motion', frameRate: 60, playbackRate: 0.5 },
  superslow: { label: 'Super slow motion', frameRate: 120, playbackRate: 0.25 }
}

function normalizeSpeed(value) {
  return SPEED_PRESETS[value] ? value : DEFAULT_SPEED
}

export function loadSettings() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    state.settings = {
      recordSeconds: Number(raw.recordSeconds) || DEFAULT_RECORD_SECONDS,
      playbackDelay: raw.playbackDelay != null ? Number(raw.playbackDelay) : DEFAULT_PLAYBACK_DELAY,
      speed: normalizeSpeed(raw.speed)
    }
  } catch {
    state.settings = { recordSeconds: DEFAULT_RECORD_SECONDS, playbackDelay: DEFAULT_PLAYBACK_DELAY, speed: DEFAULT_SPEED }
  }
}

export function saveSettings(next) {
  state.settings = next
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
}
