/**
 * A magia tema de cada tomo: plantas (Vue), ácido (Nuxt), gelo (React),
 * fumaça (Next), brasas (Laravel), raio (Web) e rocha (SQL).
 *
 * A magia aparece só no desenho, nunca em movimento: no glifo do tomo
 * (components/Glyph.vue) e no fleurão que separa tomos e capítulos
 * (utilitário `ornament`, que lê o motivo de [data-spell] no CSS).
 */
export type Spell = 'plants' | 'acid' | 'ice' | 'smoke' | 'embers' | 'lightning' | 'rock'

const SPELL_NAMES = new Set<string>(['plants', 'acid', 'ice', 'smoke', 'embers', 'lightning', 'rock'])
export const isSpell = (value: unknown): value is Spell => typeof value === 'string' && SPELL_NAMES.has(value)

/** Algarismos romanos para numerar os tomos, como num livro. */
export function toRoman(n: number) {
  const table: [number, string][] = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]
  let out = ''
  for (const [value, letters] of table) while (n >= value) { out += letters; n -= value }
  return out
}
