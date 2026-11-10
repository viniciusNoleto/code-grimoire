<script setup lang="ts">
// links "#capitulo-secao" do conteúdo apontam para a página do capítulo
const props = defineProps<{ href?: string, target?: string }>()
const route = useRoute()
const { data: tree } = useTree()
const to = computed(() => resolveContentLink(props.href ?? '', String(route.params.division ?? ''), tree.value))
</script>

<template>
  <NuxtLink :href="to" :target="target" class="text-tome underline underline-offset-3">
    <slot />
  </NuxtLink>
</template>
