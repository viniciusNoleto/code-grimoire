<script setup lang="ts">
// Monta um componente React dentro do Vue, só no navegador.
const props = defineProps<{ load: () => Promise<(...a: never[]) => unknown> }>()
const target = ref<HTMLDivElement>()
const failed = ref(false)
let root: { unmount: () => void } | null = null
onMounted(async () => {
  try {
    const [{ createElement }, { createRoot }, Component] = await Promise.all([import('react'), import('react-dom/client'), props.load()])
    root = createRoot(target.value!)
    root.render(createElement(Component as never))
  }
  catch (e) {
    console.error(e)
    failed.value = true
  }
})
onBeforeUnmount(() => root?.unmount())
</script>

<template>
  <div>
    <p v-if="failed" :class="workbench.hint">
      Não foi possível iniciar o React nesta bancada. O restante do capítulo funciona normalmente.
    </p>
    <div ref="target" />
  </div>
</template>
