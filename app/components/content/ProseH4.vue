<script setup lang="ts">
// Cada título ganha o capítulo como prefixo no id (os links "#capitulo-secao"
// do conteúdo dependem disso para achar a página do capítulo).
const props = defineProps<{ id?: string }>()
const chapter = inject<string>('chapter', '')
const prefixedId = computed(() => (props.id ? (chapter ? `${chapter}-${props.id}` : props.id) : undefined))
</script>

<template>
  <h4 :id="prefixedId" class="mt-[26px] mb-2 scroll-mt-3 font-display text-[1.04rem] font-semibold text-foreground">
    <slot />
  </h4>
</template>
