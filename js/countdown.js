// js/countdown.js — Genbrugelig nedtællings-hjælper. Bruges både til
// nedtællingen før optagelse starter og pausen før afspilning.

export function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

export async function runCountdown(overlayEl, numEl, seconds) {
  overlayEl.classList.remove('hidden')
  for (let n = seconds; n >= 1; n--) {
    numEl.textContent = n
    await sleep(1000)
  }
  overlayEl.classList.add('hidden')
}
