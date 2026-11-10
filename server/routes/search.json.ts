import { queryCollection, queryCollectionSearchSections } from '@nuxt/content/server'

/**
 * Índice da busca: cada título de seção de cada documento vira uma entrada,
 * já com o endereço na página do capítulo (/laravel/capitulo#capitulo-secao)
 * e o número exibido ("03" para capítulos, "3.2" para seções).
 * Gerado no build (pré-renderizado) e carregado sob demanda.
 */
export default defineEventHandler(async (event) => {
  const [sections, docs] = await Promise.all([
    queryCollectionSearchSections(event, 'grimoire', { maxHeading: 'h4' }),
    queryCollection(event, 'grimoire').select('path', 'title', 'nav', 'stem').order('stem', 'ASC').all(),
  ])
  const byPath = new Map(docs.map(d => [d.path, d]))
  const segmentsOf = (path: string) => path.split('/').filter(Boolean)

  // número do capítulo dentro do tomo ("03") e contador das seções ### de cada capítulo ("3.2")
  const chapterNumber = new Map<string, number>()
  for (const tome of docs.filter(d => segmentsOf(d.path).length === 2)) {
    docs.filter(d => segmentsOf(d.path).length === 3 && d.path.startsWith(tome.path + '/'))
      .forEach((c, i) => chapterNumber.set(c.path, i + 1))
  }
  const sectionCount = new Map<string, number>()

  return sections.map((s) => {
    const [path = '', hash] = s.id.split('#')
    const p = segmentsOf(path)
    const division = p[0] ?? ''
    const base = p.at(-1)
    const n = chapterNumber.get(path)
    let number = ''
    if (n) {
      if (!hash) number = String(n).padStart(2, '0')
      else if (s.level === 3) {
        sectionCount.set(path, (sectionCount.get(path) ?? 0) + 1)
        number = `${n}.${sectionCount.get(path)}`
      }
      else number = sectionCount.get(path) ? `${n}.${sectionCount.get(path)}` : String(n).padStart(2, '0')   // #### herda o número da ### acima
    }
    const id = p.length <= 2
      ? `/${division}`
      : `/${division}/${base}${hash ? `#${base}-${hash}` : ''}`
    const location = p.map((_, i) => '/' + p.slice(0, i + 1).join('/'))
      .map(c => byPath.get(c))
      .map(d => (d as { nav?: string, title: string } | undefined))
      .filter(Boolean)
      .map((d, i, arr) => (i === arr.length - 1 && d!.nav) ? d!.nav : d!.title)
      .join(' · ')
    return {
      id,
      number,
      title: s.title,
      location,
      division,
      level: s.level,
      content: s.content.replace(/\s+/g, ' ').trim(),
    }
  })
})
