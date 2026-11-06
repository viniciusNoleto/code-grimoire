<script setup lang="ts">
// Cada item avisa quando metade dele entra ou sai da área visível da caixa, sem listener de scroll.
const box = useTemplateRef<HTMLElement>('box')
const visible = ref(new Set<number>())
const log = ref<{ k: number, txt: string }[]>([])
const isSupported = ref(true)
let seq = 0
let io: IntersectionObserver | null = null

onMounted(() => {
  if (!('IntersectionObserver' in window)) { isSupported.value = false; return }
  io = new IntersectionObserver((entries) => {
    const next = new Set(visible.value)
    for (const e of entries) {
      const n = Number((e.target as HTMLElement).dataset.n)
      if (e.isIntersecting) next.add(n)
      else next.delete(n)
      log.value = [{ k: ++seq, txt: `Item ${n} ${e.isIntersecting ? 'entrou' : 'saiu'}` }, ...log.value].slice(0, 8)
    }
    visible.value = next
  }, { root: box.value, threshold: 0.5 })
  box.value?.querySelectorAll('[data-n]').forEach(el => io!.observe(el))
})
onBeforeUnmount(() => io?.disconnect())
</script>

<template>
  <p v-if="!isSupported" :class="workbench.hint">
    IntersectionObserver não está disponível neste navegador.
  </p>
  <div :class="workbench.columns">
    <div ref="box" class="grid h-56 gap-2 overflow-auto rounded-lg border border-border bg-paper p-2">
      <div
        v-for="n in 16"
        :key="n"
        :data-n="n"
        class="rounded-md border px-3 py-3.5 font-mono text-[.82rem] transition-colors duration-200"
        :class="visible.has(n) ? 'border-tome bg-tome-soft' : 'border-border bg-card'"
      >
        Item {{ n }}
      </div>
    </div>
    <ol class="m-0 h-56 overflow-auto rounded-md bg-code px-3 py-2.5 font-mono text-[.8rem] text-code-foreground" aria-live="polite">
      <li v-for="l in log" :key="l.k" class="py-0.5">
        <b class="text-tome">{{ l.txt }}</b>
      </li>
    </ol>
  </div>
</template>
