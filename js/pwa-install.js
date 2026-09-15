// js/pwa-install.js — Beder brugeren om at installere appen på hjemmeskærmen.
// Android/Chrome udløser `beforeinstallprompt`; iOS Safari sender den aldrig,
// så der vises i stedet en manuel vejledning (samme mønster som 3D-appen).

const DISMISS_KEY = 'skydevideo_pwa_dismissed_v2'

export function initPwaInstall() {
  const dismissed = localStorage.getItem(DISMISS_KEY) === '1'
  let deferredPrompt = null

  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault()
    deferredPrompt = e
    if (!dismissed) document.getElementById('pwa-banner')?.classList.remove('hidden')
  })

  document.getElementById('pwa-install-btn')?.addEventListener('click', async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    await deferredPrompt.userChoice
    deferredPrompt = null
    document.getElementById('pwa-banner').classList.add('hidden')
  })

  document.getElementById('pwa-dismiss-btn')?.addEventListener('click', () => {
    document.getElementById('pwa-banner').classList.add('hidden')
    localStorage.setItem(DISMISS_KEY, '1')
  })

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream
  const isStandalone = window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches
  if (isIOS && !isStandalone && !dismissed) {
    document.getElementById('ios-install-banner')?.classList.remove('hidden')
  }
  document.getElementById('ios-dismiss-btn')?.addEventListener('click', () => {
    document.getElementById('ios-install-banner').classList.add('hidden')
    localStorage.setItem(DISMISS_KEY, '1')
  })
}
