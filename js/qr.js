// js/qr.js — Logo øverst til højre åbner en QR-kode-modal med to koder: en
// til denne app (øverst) og en til 3D-bueskydning-appen (nederst), begge med
// en overskrift så det aldrig er tvivl om hvilken der peger hvorhen.
// Bruger qrcodejs (CDN).

const OTHER_APP_URL = 'https://bsk65.github.io/3D/'
const QR_OPTS = { width: 160, height: 160, colorDark: '#1a2e1a', colorLight: '#fff' }

function renderQr(elId, urlInputId, url) {
  const el = document.getElementById(elId)
  el.innerHTML = ''
  if (typeof window.QRCode !== 'undefined') new window.QRCode(el, { text: url, ...QR_OPTS })
  document.getElementById(urlInputId).value = url
}

function copyUrl(inputId) {
  const input = document.getElementById(inputId)
  navigator.clipboard?.writeText(input.value).catch(() => {
    input.select()
    document.execCommand('copy')
  })
}

function showQrModal() {
  renderQr('qr-canvas', 'qr-url', window.location.href)
  renderQr('qr-canvas-other', 'qr-url-other', OTHER_APP_URL)
  document.getElementById('qr-modal').classList.remove('hidden')
}

export function initQr() {
  document.getElementById('app-logo-btn')?.addEventListener('click', showQrModal)
  document.getElementById('qr-close-btn')?.addEventListener('click', () => {
    document.getElementById('qr-modal').classList.add('hidden')
  })
  document.getElementById('qr-copy-btn')?.addEventListener('click', () => copyUrl('qr-url'))
  document.getElementById('qr-copy-other-btn')?.addEventListener('click', () => copyUrl('qr-url-other'))
}
