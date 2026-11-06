<script setup lang="ts">
defineProps<{ steps: string[] }>()
</script>

<template>
  <div class="mt-[22px] flex flex-wrap items-center gap-x-2.5 gap-y-1.5 font-mono text-[.86rem]" aria-label="Caminho de uma chamada">
    <template v-for="(p, i) in steps" :key="p">
      <i v-if="i" class="text-muted-foreground not-italic">→</i>
      <span class="rounded-md border bg-card px-2.5 py-1.5" :class="i === 0 ? 'border-tome text-tome' : 'border-border'">{{ p }}</span>
    </template>
    <small class="basis-full font-sans text-[.82rem] text-muted-foreground"><slot mdc-unwrap="p" /></small>
  </div>
</template>
