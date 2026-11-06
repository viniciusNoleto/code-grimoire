// O clique solta magia (menos nos campos de texto, para não cobrir o que se digita). Dentro de um tomo (ou sobre a lombada dele na capa),
// é a magia tema daquele framework (utils/spells.ts); fora dos tomos, o anel
// de runas na cor do grimório.
export default defineNuxtPlugin(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
  let overlay: HTMLDivElement | null = null
  const ring = '<svg class="absolute -top-9 -left-9 size-18 animate-ring overflow-visible" viewBox="-28 -28 56 56"><circle r="20" fill="none" stroke="currentColor" stroke-width="1.4" stroke-dasharray="3 4"/><circle r="12" fill="none" stroke="currentColor" stroke-width="1"/><path d="M0 -12 3 -3 12 0 3 3 0 12 -3 3 -12 0 -3 -3Z" fill="currentColor" opacity=".55"/></svg>'

  addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return
    const target = (e.target as Element | null)?.closest?.('a, button, summary, label, input:not([type="search"]):not([type="text"]), select, [role="option"]')
    if (!target) return

    // a magia mais próxima: a lombada clicada ou o <html> da página do tomo
    const source = target.closest('[data-spell]')
    const spell = source?.getAttribute('data-spell')
    if (isSpell(spell)) {
      const dark = source!.getAttribute('data-backdrop') === 'dark' || isDarkNow()
      spellLayer()?.emit(spell, e.clientX, e.clientY, 1, dark)
      return
    }

    if (!overlay || !overlay.isConnected) {
      overlay = document.createElement('div')
      overlay.className = 'pointer-events-none fixed inset-0 z-80 overflow-hidden'
      document.body.appendChild(overlay)
    }
    const burst = document.createElement('span')
    burst.className = 'absolute size-0 text-tome'
    burst.style.left = `${e.clientX}px`
    burst.style.top = `${e.clientY}px`
    let html = ring
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 + Math.random() * 0.5
      const distance = 26 + Math.random() * 22
      html += `<i class="absolute -top-[3px] -left-[3px] size-1.5 animate-spark rounded-full bg-current shadow-[0_0_8px_currentColor]" style="--dx:${(Math.cos(angle) * distance).toFixed(1)}px;--dy:${(Math.sin(angle) * distance).toFixed(1)}px"></i>`
    }
    burst.innerHTML = html
    overlay.appendChild(burst)
    setTimeout(() => burst.remove(), 700)
  }, { passive: true })
})
