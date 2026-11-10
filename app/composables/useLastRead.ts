/**
 * Último ponto de leitura de cada framework, guardado num cookie legível pelo
 * cliente (`last_read`, JSON por slug do framework). O scroll é salvo relativo
 * ao último título visível (âncora + deslocamento), para sobreviver a mudanças
 * de largura de tela e de fonte; `scrollY` fica como reserva.
 */
export interface LastRead {
  chapter: string
  anchor?: string
  offset: number
  scrollY: number
  at: number
}

/** Posição a restaurar, levada no history.state da navegação de volta ao capítulo. */
export type ResumeState = Pick<LastRead, 'anchor' | 'offset' | 'scrollY'>

const ONE_YEAR = 60 * 60 * 24 * 365

export function useLastRead() {
  const cookie = useCookie<Record<string, LastRead>>('last_read', {
    default: () => ({}),
    maxAge: ONE_YEAR,
    sameSite: 'lax',
    path: '/',
  })

  const get = (division: string): LastRead | undefined => cookie.value?.[division]
  const save = (division: string, entry: LastRead) => {
    cookie.value = { ...cookie.value, [division]: entry }
  }

  return { get, save }
}

/** Título com id mais próximo acima do topo da janela, e quanto já se rolou depois dele. */
export function measureReadingPoint(root: HTMLElement): ResumeState {
  const scrollY = Math.round(window.scrollY)
  let anchor: HTMLElement | undefined
  for (const el of root.querySelectorAll<HTMLElement>('section[id], h2[id], h3[id], h4[id]')) {
    if (el.getBoundingClientRect().top > 1) break
    anchor = el
  }
  if (!anchor) return { offset: 0, scrollY }
  const anchorTop = anchor.getBoundingClientRect().top + window.scrollY
  return { anchor: anchor.id, offset: Math.round(window.scrollY - anchorTop), scrollY }
}

export function restoreReadingPoint(point: ResumeState) {
  const el = point.anchor ? document.getElementById(point.anchor) : null
  const top = el ? el.getBoundingClientRect().top + window.scrollY + point.offset : point.scrollY
  window.scrollTo({ top: Math.max(0, top), behavior: 'instant' })
}
