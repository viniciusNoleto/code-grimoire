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

/** Último trecho do caminho: é o id da seção na página contínua. */
export const slugOf = (path: string) => segments(path).at(-1) ?? ''

/** Endereço de um tomo ou capítulo dentro da página contínua do framework. */
export const anchorOf = (path: string) => {
  const p = segments(path)
  return p.length <= 1 ? `/${p[0] ?? ''}` : `/${p[0]}#${p.at(-1)}`
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
