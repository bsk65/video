# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Bue videotræning (repo/package name: skydevideo) is a Danish-language PWA for archers to record themselves with the phone's front camera and immediately review the footage. No backend, no accounts — everything happens client-side in the browser. Hosted at base path `/video/`.

Sister app: 3D Bueskydning (separate repo/hosting at `/3D/`). The two apps cross-link via QR codes in the logo/QR modal (`js/qr.js`) — each app shows its own QR on top and the other app's QR below, both labelled. If either app's hosting URL ever changes, update the hardcoded URL on both sides (`OTHER_APP_URL` here, and the equivalent constant in 3D's `js/app-init.js`).

## Commands

```bash
npm run dev       # Start Vite dev server (localhost:5173/video/)
npm run build     # Build to /dist
npm run preview   # Preview production build
build.bat         # Full Windows build → git push til produktion (/video/)
build-dev.bat     # Test-build → git push til dev-branch (/video/video-dev/)
```

`build.bat` copies `index.src.html` to `index.html` before building. Edit `index.src.html`, not `index.html`.

**Workflow:** Lav ændringer på `dev`-branchen og test via `build-dev.bat` på `https://bsk65.github.io/video/video-dev/`. Når alt virker, merge til `main` og kør `build.bat`.

## Architecture

**Stack:** Vanilla JS + Vite. No framework, no Firebase, no server.

**Standing rule (samme som 3D-appen):** al ny logik skal i det relevante eksisterende modul (eller et nyt modul, hvis ingen passer) — aldrig i `main.js`. Al ny styling skal være en navngivet klasse i `css/style.css`, aldrig inline `style="..."` (undtagen elementer hvor JS sætter `.style.display=''` for at vise dem igen — de skal beholde `display:none` inline).

**State** lever i ét delt singleton-objekt i `js/state.js`, importeret og muteret direkte af de andre moduler.

**Key modules:**

| File | Responsibility |
|------|---------------|
| `js/main.js` | Tynd facade — importerer kun `app-init.js`. Ny logik hører IKKE hjemme her. |
| `js/app-init.js` | Opstart: venter på `DOMContentLoaded`, kalder `initUI()` |
| `js/state.js` | Central delt state-singleton (stream, recorder, chunks, indstillinger) |
| `js/camera.js` | Ren kamera-adgang: `getUserMedia` mod frontkameraet, ingen andre moduler kalder den direkte |
| `js/recorder.js` | Ren `MediaRecorder`-logik: vælger mimeType, styrer optagelse, bygger blob-URL |
| `js/countdown.js` | Genbrugelig nedtællings-hjælper (bruges både før optagelse og før afspilning) |
| `js/settings.js` | Indstillinger (optagelængde/afspilningsforsinkelse) — load/save mod `localStorage` |
| `js/ui.js` | DOM-elementer, skærm-skift, sammenkobler de rene moduler til det faktiske flow |
| `js/qr.js` | Logo øverst til højre åbner en QR-kode med appens egen adresse (qrcodejs via CDN) |
| `js/pwa-install.js` | Installer-banner (Android via `beforeinstallprompt`, manuel vejledning på iOS) |

## Flow

Kamera åbner automatisk ved opstart (frontkamera, `facingMode:'user'`) → bruger trykker optag-knappen → 3 sekunders nedtælling → optagelse i N sekunder (indstilleligt, default 10) → automatisk stop → kort pause (indstilleligt, default 2 sekunder) → optagelsen afspilles automatisk. Brugeren kan downloade optagelsen eller optage igen.

## Non-Obvious Behaviors

- Optagelsen forlader aldrig telefonen af sig selv — den ligger kun som en blob-URL i browseren, indtil brugeren trykker "Download" eller optager en ny (som overskriver den forrige).
- Kameraadgang kræver en sikker kontekst (HTTPS eller localhost) — virker ikke over almindelig `http://` på LAN, derfor skal test på telefon ske via den deployede `/video-dev/`-URL, ikke en lokal dev-server tilgået fra telefonen.
- Indstillinger gemmes i egen localStorage-nøgle `skydevideo_settings`.
