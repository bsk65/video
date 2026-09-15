// js/sw-register.js — Registrerer en minimal service worker (se public/sw.js
// / dist-roden). Ingen offline-caching — kun for at opfylde browserens krav
// for at vise installations-prompten (beforeinstallprompt).

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return
  navigator.serviceWorker
    .register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL })
    .catch(() => {})
}
