import { queryCollection } from '@nuxt/content/server'

/**
 * Metadados de todos os documentos (sem o corpo), para montar a árvore do grimório.
 * As consultas ficam no servidor: no navegador, o Nuxt Content baixaria o SQLite
 * em WASM e o dump inteiro do banco (quase 2 MB) só para trocar de capítulo.
 */
export default defineEventHandler(event =>
  queryCollection(event, 'grimoire')
    .select('path', 'title', 'description', 'nav', 'group', 'version', 'color', 'colorDark', 'order', 'spell', 'cover', 'stem')
    .order('stem', 'ASC')
    .all(),
)
