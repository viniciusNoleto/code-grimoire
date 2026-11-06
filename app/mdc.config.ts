import { defineConfig } from '@nuxtjs/mdc/config'
import { sqlLines } from '../shiki/sql-lines'

export default defineConfig({
  shiki: {
    transformers: (code, lang) => sqlLines(code, lang),
  },
})
