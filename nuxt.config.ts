import tailwindcss from '@tailwindcss/vite'
import { createCssVariablesTheme } from 'shiki/core'

// Cores do código vêm de variáveis CSS (app/assets/css/tailwind.css),
// assim o mesmo HTML serve para o tema claro e o escuro.
const grimoireTheme = createCssVariablesTheme({
  name: 'grimoire',
  variablePrefix: '--tk-',
  variableDefaults: {},
  fontStyle: true,
})

export default defineNuxtConfig({
  compatibilityDate: '2026-11-01',
  modules: ['@nuxt/content', '@nuxt/icon', '@nuxt/fonts', '@nuxtjs/color-mode', 'shadcn-nuxt', '@vite-pwa/nuxt'],
  // Tailwind CSS v4: tokens, variantes e base; o resto são utilitários nos componentes
  css: ['~/assets/css/tailwind.css'],

  vite: { plugins: [tailwindcss()] },

  // componentes do shadcn-vue em app/components/ui, usados sem prefixo (<Input>)
  shadcn: { prefix: '', componentDir: '@/components/ui' },

  // ícones do Iconify (coleção lucide, a mesma do shadcn-vue), embutidos no build
  icon: {
    mode: 'svg',
    serverBundle: { collections: ['lucide'] },
    clientBundle: { scan: true },
  },

  // fontes baixadas e servidas pelo próprio site, com fallbacks ajustados
  fonts: {
    families: [
      { name: 'IBM Plex Sans', provider: 'google', weights: [400, 500, 600], styles: ['normal', 'italic'] },
      { name: 'Bricolage Grotesque', provider: 'google', weights: [600, 800] },
      { name: 'JetBrains Mono', provider: 'google', weights: [400, 600] },
      { name: 'IM Fell English', provider: 'google', weights: [400], styles: ['normal', 'italic'] },
    ],
  },

  // tema claro/escuro: sem escolha salva, segue o sistema; o CSS lê data-theme no <html>
  colorMode: {
    preference: 'system',
    fallback: 'light',
    dataValue: 'theme',
    classSuffix: '',
    storageKey: 'grimoire:theme',
  },

  devServer: { host: 'localhost' },

  app: {
    head: {
      htmlAttrs: { lang: 'pt-BR' },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'color-scheme', content: 'light dark' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/sigil.svg' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon-180x180.png' },
      ],
      script: [
        // classe .js e preferência de SQL aplicadas antes da primeira pintura (o tema fica com o color-mode)
        {
          innerHTML: `(function(){var d=document.documentElement;d.classList.add('js');try{if(localStorage.getItem('grimoire:sql')==='hidden')d.classList.add('sql-hidden')}catch(e){}})()`,
          tagPosition: 'head',
        },
      ],
    },
  },

  content: {
    experimental: { sqliteConnector: 'native' },
    build: {
      markdown: {
        toc: { depth: 4, searchDepth: 4 },
        highlight: {
          theme: { default: grimoireTheme },
          langs: ['php', 'sql', 'js', 'jsx', 'ts', 'tsx', 'json', 'bash', 'vue', 'html', 'css', 'http', 'nginx', 'ini', 'go'],
        },
      },
    },
  },

  // PWA: instalável (abre em tela cheia, sem a barra do navegador) e com os
  // capítulos já lidos disponíveis offline. O site é SSR, então não há página
  // de fallback: cada endereço vem da rede e, sem rede, do cache.
  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'Grimório de código',
      short_name: 'Grimório',
      description: 'A plataforma web, Vue, React, Nuxt, Next.js, SQL, Laravel e Go estudados por dentro.',
      lang: 'pt-BR',
      start_url: '/',
      scope: '/',
      display: 'standalone',
      orientation: 'portrait',
      // a capa do livro: couro e ouro
      background_color: '#2a1d16',
      theme_color: '#2a1d16',
      icons: [
        { src: '/pwa-64x64.png', sizes: '64x64', type: 'image/png' },
        { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
        { src: '/maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    generateSW: {
      navigateFallback: null,
      globPatterns: ['**/*.{js,css,woff2,svg,png}'],
      // o SQLite em WASM do Nuxt Content não é usado no navegador (as consultas vão para /api/grimoire)
      globIgnores: ['**/sqlite3*', '**/*.wasm'],
      runtimeCaching: [
        {
          urlPattern: ({ request }) => request.mode === 'navigate',
          handler: 'NetworkFirst',
          options: { cacheName: 'pages', networkTimeoutSeconds: 4, expiration: { maxEntries: 200 } },
        },
        {
          urlPattern: ({ url }) => url.pathname.startsWith('/api/grimoire/') || url.pathname.endsWith('_payload.json'),
          handler: 'NetworkFirst',
          options: { cacheName: 'content', networkTimeoutSeconds: 4, expiration: { maxEntries: 300 } },
        },
        {
          urlPattern: ({ url }) => url.pathname === '/search.json',
          handler: 'StaleWhileRevalidate',
          options: { cacheName: 'search' },
        },
      ],
    },
    client: { installPrompt: false },
  },

  nitro: {
    prerender: {
      crawlLinks: true,
      routes: ['/', '/search.json'],
    },
  },
})
