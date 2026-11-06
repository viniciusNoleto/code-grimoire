<script setup lang="ts">
// Página de erro (404 e outros), com título próprio.
import type { NuxtError } from '#app'
import { Button } from '~/components/ui/button'

const props = defineProps<{ error: NuxtError }>()
const notFound = computed(() => props.error.statusCode === 404)
const title = computed(() => (notFound.value ? 'Página não encontrada' : 'Algo deu errado'))

useHead({ titleTemplate: t => `${t} · Grimório de código` })
useSeoMeta({ title, robots: 'noindex' })
useHead({ bodyAttrs: { class: 'bg-desk' } })
</script>

<template>
  <main id="content" class="grid min-h-svh place-items-center px-4">
    <div class="paper-grain stacked-pages max-w-lg rounded-[3px_10px_10px_3px] px-10 py-12 text-center">
      <Glyph :ring="true" class="mx-auto mb-6 size-24 text-gold" />
      <p class="font-mono text-[.74rem] tracking-[.14em] text-muted-foreground uppercase">
        Erro {{ error.statusCode }}
      </p>
      <h1 class="mt-2 mb-3 font-book text-[2.4rem] leading-tight font-normal">
        {{ title }}
      </h1>
      <p class="mb-6 text-muted-foreground">
        {{ notFound ? 'Este feitiço não está em nenhum tomo do grimório.' : error.statusMessage || 'Recarregue a página e tente de novo.' }}
      </p>
      <Button @click="clearError({ redirect: '/' })">
        <Icon name="lucide:book-open" />
        Voltar à capa
      </Button>
    </div>
  </main>
</template>
