import { queryCollection, queryCollectionSearchSections } from '@nuxt/content/server'

/**
 * Índice da busca: cada título de seção de cada documento vira uma entrada,
 * já com o endereço na página contínua do framework (/laravel#capitulo-secao).
 * Gerado no build (pré-renderizado) e carregado sob demanda.
 */
export default defineEventHandler(async (event) => {
  const [sections, docs] = await Promise.all([
    queryCollectionSearchSections(event, 'grimoire', { maxHeading: 'h4' }),
    queryCollection(event, 'grimoire').select('path', 'title', 'nav').all(),
  ])
  const byPath = new Map(docs.map(d => [d.path, d]))
  return sections.map((s) => {
    const [path = '', hash] = s.id.split('#')
    const p = path.split('/').filter(Boolean)
    const division = p[0] ?? ''
    const base = p.at(-1)
    const id = p.length <= 1
      ? `/${division}${hash ? '#' + hash : ''}`
      : `/${division}#${hash ? `${base}-${hash}` : base}`
    const location = p.map((_, i) => '/' + p.slice(0, i + 1).join('/'))
      .map(c => byPath.get(c))
      .map(d => (d as { nav?: string, title: string } | undefined))
      .filter(Boolean)
      .map((d, i, arr) => (i === arr.length - 1 && d!.nav) ? d!.nav : d!.title)
      .join(' · ')
    return {
      id,
      title: s.title,
      location,
      division,
      level: s.level,
      content: s.content.replace(/\s+/g, ' ').trim(),
    }
  })
})
