/**
 * Índice de busca compartilhado (busca global e busca do índice lateral).
 * Carregado uma vez, sob demanda, de /search.json (gerado no build).
 */
export interface SearchSection { id: string, number: string, title: string, location: string, division: string, level: number, content: string }
export interface IndexedSection extends SearchSection { nTitle: string, nLocation: string, nContent: string }
export interface SearchHit { section: IndexedSection, excerpt: { before: string, match: string, after: string } | null }

// normalização 1:1 por caractere, para achar a posição no texto original
const normalizeChar = (c: string) => (c.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()[0] ?? ' ')
export const normalize = (s: string) => Array.from(s, normalizeChar).join('')

export function useSearchIndex() {
  const index = useState<IndexedSection[] | null>('search-index', () => null)
  const failed = useState('search-index-failed', () => false)

  async function load() {
    if (index.value) return
    try {
      const sections = await $fetch<SearchSection[]>('/search.json')
      index.value = sections.map(s => ({ ...s, nTitle: normalize(s.title), nLocation: normalize(s.location), nContent: normalize(s.content) }))
    }
    catch { failed.value = true }
  }

  function excerpt(s: IndexedSection, terms: string[]) {
    for (const t of terms) {
      const i = s.nContent.indexOf(t)
      if (i >= 0) {
        const start = Math.max(0, i - 48)
        return {
          before: (start > 0 ? '…' : '') + s.content.slice(start, i),
          match: s.content.slice(i, i + t.length),
          after: s.content.slice(i + t.length, i + t.length + 90) + '…',
        }
      }
    }
    return s.content ? { before: '', match: '', after: s.content.slice(0, 120) + (s.content.length > 120 ? '…' : '') } : null
  }

  function search(query: string, options: { division?: string, limit?: number } = {}): SearchHit[] {
    const q = normalize(query.trim())
    if (!q || !index.value) return []
    const terms = q.split(/\s+/).filter(Boolean)
    const scored: { s: IndexedSection, score: number }[] = []
    for (const s of index.value) {
      if (options.division && s.division !== options.division) continue
      let score = 0
      for (const t of terms) {
        if (s.nTitle.includes(t)) score += s.nTitle.startsWith(t) || s.nTitle.includes(' ' + t) ? 8 : 5
        else if (s.nLocation.includes(t)) score += 2
        else if (s.nContent.includes(t)) score += 1
        else { score = 0; break }
      }
      if (score) scored.push({ s, score: score + (s.level <= 2 ? 0.5 : 0) })
    }
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, options.limit ?? 24)
      .map(({ s }) => ({ section: s, excerpt: excerpt(s, terms) }))
  }

  return { index, failed, load, search }
}
