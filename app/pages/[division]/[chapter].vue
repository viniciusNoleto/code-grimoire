<script setup lang="ts">
// Um capítulo em página própria: só o corpo dele é carregado e renderizado.
import type { ResumeState } from '~/composables/useLastRead'
import { useEventListener, useThrottleFn } from '@vueuse/core'

// voltando de "Continuar de onde parei", o próprio capítulo restaura o scroll
// (a posição vem no history.state); o router não deve levar a página ao topo
definePageMeta({
  scrollToTop: () => !(import.meta.client && window.history.state?.resume),
})

const route = useRoute()
const slug = String(route.params.division)
const chapterSlug = String(route.params.chapter)
const { data: tree } = await useTree()
const division = computed(() => tree.value.find(d => d.path === `/${slug}`))
if (!division.value) {
  throw createError({ statusCode: 404, statusMessage: 'Este framework não está no grimório', fatal: true })
}

// endereço antigo de um tomo (/laravel/laravel-por-dentro): a abertura do framework
if (division.value.tomes.some(t => slugOf(t.path) === chapterSlug)) {
  await navigateTo(`/${slug}`, { replace: true, redirectCode: 301 })
}

const tome = division.value.tomes.find(t => t.chapters.some(c => slugOf(c.path) === chapterSlug))
const index = tome?.chapters.findIndex(c => slugOf(c.path) === chapterSlug) ?? -1
const meta = tome?.chapters[index]
if (!tome || !meta) {
  throw createError({ statusCode: 404, statusMessage: 'Este capítulo não está no grimório', fatal: true })
}

const { data: doc } = await useAsyncData(`chapter:${meta.path}`, () => queryCollection('grimoire').path(meta.path).first())
const hasSql = computed(() => JSON.stringify(doc.value?.body ?? '').includes('line sql'))

const linkOf = (c?: { path: string }) => (c ? `/${slug}/${slugOf(c.path)}` : undefined)
const previous = tome.chapters[index - 1]
const next = tome.chapters[index + 1]

useSeoMeta({ title: `${meta.nav || meta.title} · ${division.value.title}`, description: meta.description })

// ponto de leitura: salvo no cookie last_read enquanto se rola o capítulo
const { save } = useLastRead()
let reading = false
const saveReadingPoint = () => {
  const root = document.getElementById('content')
  if (!reading || !root) return
  save(slug, { chapter: chapterSlug, ...measureReadingPoint(root), at: Date.now() })
}
const throttledSave = useThrottleFn(saveReadingPoint, 500, true)
useEventListener(import.meta.client ? window : undefined, 'scroll', throttledSave, { passive: true })
useEventListener(import.meta.client ? window : undefined, 'pagehide', saveReadingPoint)

onMounted(async () => {
  const resume: ResumeState | undefined = window.history.state?.resume
  if (resume) {
    // consome a posição: recarregar ou voltar pelo histórico não restaura de novo
    window.history.replaceState({ ...window.history.state, resume: null }, '')
    await nextTick()
    restoreReadingPoint(resume)
    // fontes e demos podem mudar a altura do texto depois da primeira pintura
    await document.fonts?.ready
    restoreReadingPoint(resume)
  }
  reading = true
  saveReadingPoint()
})
onBeforeUnmount(() => { reading = false })
</script>

<template>
  <DivisionShell :division="division!" :active="chapterSlug" :has-sql="hasSql">
    <ChapterSection v-if="doc" :doc="doc" :number="index + 1" />

    <!-- capítulo anterior e seguinte, para ler em sequência -->
    <nav class="mt-12 grid grid-cols-2 gap-2.5 border-t border-border pt-5 max-sm:grid-cols-1" aria-label="Outros capítulos">
      <NuxtLink
        v-if="previous"
        :to="linkOf(previous)"
        class="grid rounded-md border border-border bg-card px-3.5 py-2.5 text-foreground no-underline hover:border-tome"
      >
        <span class="text-[.78rem] text-muted-foreground">← Anterior · {{ String(index).padStart(2, '0') }}</span>
        <span class="text-[.92rem] leading-snug font-medium">{{ previous.nav || previous.title }}</span>
      </NuxtLink>
      <span v-else />
      <NuxtLink
        v-if="next"
        :to="linkOf(next)"
        class="grid rounded-md border border-border bg-card px-3.5 py-2.5 text-right text-foreground no-underline hover:border-tome max-sm:text-left"
      >
        <span class="text-[.78rem] text-muted-foreground">Próximo · {{ String(index + 2).padStart(2, '0') }} →</span>
        <span class="text-[.92rem] leading-snug font-medium">{{ next.nav || next.title }}</span>
      </NuxtLink>
    </nav>
  </DivisionShell>
</template>
