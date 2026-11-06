<script setup lang="ts">
// Um capítulo dentro da página contínua do framework.
import { useIntersectionObserver } from '@vueuse/core'

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

// o traço sob o título é "escrito" quando o capítulo chega à tela
const sectionEl = useTemplateRef<HTMLElement>('section')
const seen = ref(false)
const { stop } = useIntersectionObserver(sectionEl, ([e]) => {
  if (e?.isIntersecting) { seen.value = true; stop() }
}, { threshold: 0.05 })
</script>

<template>
  <section :id="slug" ref="section" data-chapter class="scroll-mt-2 pt-13">
    <span v-if="number > 1" class="ornament mx-auto mt-1.5 mb-9 block h-4 w-16 opacity-60" aria-hidden="true" />
    <div
      class="relative mb-3.5 flex items-baseline gap-3.5 pb-2.5 after:absolute after:inset-x-0 after:-bottom-px after:h-px after:origin-left after:bg-linear-to-r after:from-tome after:to-border after:to-35% after:transition-transform after:duration-1100 after:ease-grimoire"
      :class="seen ? 'after:scale-x-100' : 'js:motion-safe:after:scale-x-0'"
    >
      <span class="font-mono text-[.85rem] text-tome">{{ pad(number) }}</span>
      <h2 class="m-0 font-display text-[clamp(1.55rem,3.4vw,2.05rem)] leading-[1.1] font-extrabold tracking-[-.02em] text-balance [&_code]:text-[.8em]">
        {{ doc.title }}
      </h2>
    </div>
    <nav v-if="sections.length > 1" class="mb-[22px] flex flex-wrap gap-1.5" aria-label="Nesta seção">
      <a
        v-for="(s, i) in sections"
        :key="s.id"
        :href="`#${slug}-${s.id}`"
        class="inline-flex max-w-full items-baseline gap-1.5 rounded-full border border-border bg-card px-[9px] py-1 text-[.8rem] leading-[1.3] text-muted-foreground no-underline transition hover:border-tome hover:text-foreground hover:shadow-[0_0_0_3px_color-mix(in_srgb,var(--tome)_14%,transparent)]"
      ><span class="font-mono text-[.7rem] text-tome">{{ number }}.{{ i + 1 }}</span>{{ s.text }}</a>
    </nav>
    <ContentRenderer :value="doc" />
  </section>
</template>
