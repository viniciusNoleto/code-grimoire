import { defineCollection, defineContentConfig, z } from '@nuxt/content'

/**
 * Todo o conhecimento do grimório mora em content/, em Markdown.
 *
 *   content/<framework>/index.md                 → o framework (nome, cor, descrição)
 *   content/<framework>/<tomo>/index.md          → a abertura de um tomo (guia)
 *   content/<framework>/<tomo>/NN.<capitulo>.md  → um capítulo (NN dá a ordem)
 *
 * Cada framework é lido numa página contínua: /<framework>, com todos os
 * tomos e capítulos em sequência e o índice lateral acompanhando a leitura.
 */
export default defineContentConfig({
  collections: {
    grimoire: defineCollection({
      type: 'page',
      source: '**/*.md',
      schema: z.object({
        /** Nome curto no índice lateral (capítulos). */
        nav: z.string().optional(),
        /** Grupo do índice lateral ao qual o capítulo pertence. */
        group: z.string().optional(),
        /** Versões ou escopo cobertos (tomos). */
        version: z.string().optional(),
        /** Cor do framework no tema claro, ex. "#b8321c" (frameworks). */
        color: z.string().optional(),
        /** Cor do framework no tema escuro (frameworks). */
        colorDark: z.string().optional(),
        /** Posição do framework na capa e nas listas (frameworks). */
        order: z.number().optional(),
        /** Magia tema do framework: o efeito que aparece na página dele (frameworks). */
        spell: z.enum(['plants', 'acid', 'ice', 'smoke', 'embers', 'lightning', 'rock']).optional(),
        /** Cor da lombada do framework na capa do grimório (frameworks). */
        cover: z.string().optional(),
        /** Nota de fontes ao fim do tomo (tomos). */
        source: z.string().optional(),
      }),
    }),
  },
})
