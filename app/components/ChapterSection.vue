<script setup lang="ts">
// Um capítulo: título, atalhos para as seções e o corpo (cada capítulo tem página própria).

const props = defineProps<{ doc: any, number: number }>()
const slug = slugOf(props.doc.path)
provide('chapter', slug)

const pad = (n: number) => String(n).padStart(2, '0')
// seções (###) do capítulo, na ordem, para a navegação interna e a numeração dos títulos
const sections = computed(() => {
  const out: { id: string, text: string }[] = []
  const walk = (ls: any[] = []) => ls.forEach((l) => { if (l.depth === 3) out.push(l); walk(l.children) })
  walk(props.doc.body?.toc?.links)
  return out
})
provide('sectionNumber', (id?: string) => {
  const i = sections.value.findIndex(s => s.id === id)
  return i < 0 ? '' : `${props.number}.${i + 1}`
})
</script>

<template>
  <section :id="slug" data-chapter class="scroll-mt-2 pt-4">
    <!-- traço sob o título: o começo na cor do tomo, o resto discreto -->
    <div class="relative mb-3.5 flex items-baseline gap-3.5 border-b border-border pb-2.5 after:absolute after:-bottom-px after:left-0 after:h-0.5 after:w-14 after:bg-tome">
      <span class="text-[.9rem] text-tome tabular-nums">{{ pad(number) }}</span>
      <h2 class="m-0 font-display text-[clamp(1.55rem,3.4vw,2.05rem)] leading-[1.1] font-extrabold tracking-[-.02em] text-balance [&_code]:text-[.8em]">
        {{ doc.title }}
      </h2>
    </div>
    <nav v-if="sections.length > 1" class="mb-[22px] flex flex-wrap gap-1.5" aria-label="Nesta seção">
      <a
        v-for="(s, i) in sections"
        :key="s.id"
        :href="`#${slug}-${s.id}`"
        class="inline-flex max-w-full items-baseline gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-[.8rem] leading-[1.3] text-muted-foreground no-underline hover:border-tome hover:text-foreground"
      ><span class="text-[.74rem] text-tome tabular-nums">{{ number }}.{{ i + 1 }}</span>{{ s.text }}</a>
    </nav>
    <ContentRenderer :value="doc" />
  </section>
</template>
