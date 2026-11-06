<script setup lang="ts">
// Na página contínua, cada título ganha o capítulo como prefixo no id,
// para não colidir com títulos iguais de outros capítulos.
const props = defineProps<{ id?: string }>()
const chapter = inject<string>('chapter', '')
const prefixedId = computed(() => (props.id ? (chapter ? `${chapter}-${props.id}` : props.id) : undefined))
</script>

<template>
  <h2 :id="prefixedId" class="mt-12 mb-3 scroll-mt-3 font-display text-[clamp(1.4rem,3vw,1.75rem)] leading-[1.15] font-extrabold tracking-[-.02em] text-balance [&_code]:text-[.8em]">
    <slot />
  </h2>
</template>
