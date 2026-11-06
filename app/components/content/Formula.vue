<script setup lang="ts">
const props = defineProps<{ expr: string }>()
const parts = computed(() => {
  const m = props.expr.match(/^(\S+)(\s*=\s*.*)$/)
  return m ? { output: m[1], rest: m[2] } : null
})
</script>

<template>
  <div class="mt-[22px] inline-flex flex-wrap items-baseline gap-2 rounded-lg border border-border bg-card px-3.5 py-2.5 font-mono text-base">
    <template v-if="parts">
      <b class="text-tome">{{ parts.output }}</b><span>{{ parts.rest }}</span>
    </template>
    <span v-else>{{ expr }}</span>
  </div>
</template>
