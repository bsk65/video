// js/app-init.js — Opstart: venter til DOM er klar og starter UI-flowet,
// QR-kode-visning og installer-prompten.

import { initUI } from './ui.js'
import { initQr } from './qr.js'
import { initPwaInstall } from './pwa-install.js'

document.addEventListener('DOMContentLoaded', () => {
  initUI()
  initQr()
  initPwaInstall()
})
