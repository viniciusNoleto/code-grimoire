<script setup lang="ts">
defineProps<{ type?: 'note' | 'pitfall' | 'tip', title?: string }>()
const STYLES = {
  note: { box: 'border-sql bg-sql-soft', tag: 'text-sql' },
  pitfall: { box: 'border-trap bg-trap-soft', tag: 'text-trap' },
  tip: { box: 'border-tome bg-tome-soft', tag: 'text-tome' },
}
</script>

<template>
  <div class="my-[18px] max-w-[68ch] rounded-r-lg border-l-3 px-4 py-[11px] [&>p:last-child]:mb-0" :class="STYLES[type || 'note'].box">
    <span v-if="title" class="mb-0.5 block font-mono text-[.68rem] font-semibold tracking-[.12em] uppercase" :class="STYLES[type || 'note'].tag">{{ title }}</span>
    <slot />
  </div>
</template>
