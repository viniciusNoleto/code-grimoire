<script setup lang="ts">
defineProps<{ href?: string, target?: string }>()
</script>

<template>
  <NuxtLink :href="href" :target="target" class="text-tome underline underline-offset-3">
    <slot />
  </NuxtLink>
</template>
