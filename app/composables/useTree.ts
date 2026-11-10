import type { Spell } from '~/utils/spells'

/**
 * A árvore do grimório (frameworks → tomos → capítulos), montada a partir
 * dos metadados de content/. Não traz o corpo dos documentos.
 */
export interface TreeNode {
  path: string
  title: string
  description?: string
  nav?: string
  group?: string
  version?: string
  color?: string
  colorDark?: string
  order?: number
  spell?: Spell
  cover?: string
  stem: string
}
export interface Tome extends TreeNode { chapters: TreeNode[] }
export interface Division extends TreeNode { tomes: Tome[] }

const segments = (p: string) => p.split('/').filter(Boolean)

/** Último trecho do caminho: é o id do capítulo (e o prefixo dos ids das suas seções). */
export const slugOf = (path: string) => segments(path).at(-1) ?? ''

/** Endereço de um framework, tomo ou capítulo: capítulos têm página própria (/laravel/rotas). */
export const anchorOf = (path: string) => {
  const p = segments(path)
  if (p.length <= 1) return `/${p[0] ?? ''}`
  return p.length === 2 ? `/${p[0]}` : `/${p[0]}/${p.at(-1)}`
}

/**
 * Converte um link do conteúdo em endereço de página.
 * Os capítulos citam seções como "#capitulo-secao" (mesmo framework) ou
 * "/web#capitulo-secao" (outro framework); o capítulo é o slug que prefixa o hash.
 */
export function resolveContentLink(href: string, currentDivision: string, tree: Division[]) {
  const m = href.match(/^(?:\/([\w-]+))?#(.+)$/)
  if (!m) return href
  const divisionSlug = m[1] ?? currentDivision
  const hash = m[2]!
  const division = tree.find(d => d.path === `/${divisionSlug}`)
  if (!division) return href
  if (division.tomes.some(t => slugOf(t.path) === hash)) return `/${divisionSlug}`
  const chapter = division.tomes
    .flatMap(t => t.chapters.map(c => slugOf(c.path)))
    .filter(c => hash === c || hash.startsWith(c + '-'))
    .sort((a, b) => b.length - a.length)[0]
  if (!chapter) return href
  return `/${divisionSlug}/${chapter}${hash === chapter ? '' : '#' + hash}`
}

export function useTree() {
  return useAsyncData('tree', async () => {
    const docs = await queryCollection('grimoire')
      .select('path', 'title', 'description', 'nav', 'group', 'version', 'color', 'colorDark', 'order', 'spell', 'cover', 'stem')
      .order('stem', 'ASC')
      .all() as TreeNode[]
    const divisions: Division[] = docs
      .filter(d => segments(d.path).length === 1)
      .map(d => ({ ...d, tomes: [] as Tome[] }))
      .sort((a, b) => (a.order ?? 99) - (b.order ?? 99))
    for (const t of docs.filter(d => segments(d.path).length === 2)) {
      const division = divisions.find(d => d.path === '/' + segments(t.path)[0])
      division?.tomes.push({
        ...t,
        chapters: docs.filter(c => segments(c.path).length === 3 && c.path.startsWith(t.path + '/')),
      })
    }
    return divisions
  }, { default: () => [] as Division[] })
}

/** Agrupa capítulos pelo campo `group`, mantendo a ordem. */
export function groupChapters<T extends { group?: string }>(chapters: T[]) {
  const groups: { name: string, chapters: T[] }[] = []
  for (const c of chapters) {
    const name = c.group || 'Capítulos'
    let g = groups.at(-1)
    if (!g || g.name !== name) { g = { name, chapters: [] }; groups.push(g) }
    g.chapters.push(c)
  }
  return groups
}
