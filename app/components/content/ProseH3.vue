<script setup lang="ts">
// Na página contínua, cada título ganha o capítulo como prefixo no id,
// para não colidir com títulos iguais de outros capítulos.
const props = defineProps<{ id?: string }>()
const chapter = inject<string>('chapter', '')
const prefixedId = computed(() => (props.id ? (chapter ? `${chapter}-${props.id}` : props.id) : undefined))
// número da seção ("3.2"), dado pelo capítulo (ChapterSection.vue)
const sectionNumber = inject<(id?: string) => string>('sectionNumber', () => '')
const number = computed(() => sectionNumber(props.id))
</script>

<template>
  <h3 :id="prefixedId" class="mt-[38px] mb-2.5 scroll-mt-3 font-display text-[1.24rem] leading-tight font-semibold tracking-[-.01em] text-balance [&_code]:text-[.8em]">
    <a
      v-if="prefixedId && number"
      :href="`#${prefixedId}`"
      class="mr-2.5 font-mono text-[.78rem] font-normal tracking-normal text-tome no-underline"
      aria-hidden="true"
      tabindex="-1"
    >{{ number }}</a><slot />
  </h3>
</template>
