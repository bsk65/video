// js/state.js — Central delt state-singleton, importeret og muteret direkte
// af de andre moduler (reference-identitet er bevidst delt), som i 3D-appen.

export const state = {
  stream: null,
  recorder: null,
  chunks: [],
  lastBlobUrl: null,
  recordedMimeType: 'video/webm',
  settings: { recordSeconds: 10, playbackDelay: 2, speed: 'normal' }
}
