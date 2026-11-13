import { queryCollection } from '@nuxt/content/server'

/** Documentos completos (com o corpo) pelos caminhos pedidos: ?path=/laravel/x&path=/laravel/y */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const paths = ([] as unknown[]).concat(query.path ?? []).map(String).filter(p => p.startsWith('/'))
  if (!paths.length) return []
  return queryCollection(event, 'grimoire').where('path', 'IN', paths).all()
})
