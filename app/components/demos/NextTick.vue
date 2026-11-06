<script setup lang="ts">
// Três incrementos seguidos geram um único render, aplicado no próximo tick.
const count = ref(0)
const onScreen = useTemplateRef<HTMLElement>('onScreen')
const log = ref<[string, string][]>([])

async function run() {
  const lines: [string, string][] = []
  count.value++
  count.value++
  count.value++
  lines.push(['count.value', String(count.value)])
  lines.push(['DOM logo depois de mudar', onScreen.value?.textContent ?? ''])
  await nextTick()
  lines.push(['DOM após await nextTick()', onScreen.value?.textContent ?? ''])
  log.value = lines
}
</script>

<template>
  <div>
    <div :class="workbench.buttons">
      <Button type="button" size="sm" @click="run">
        count++ três vezes e ler o DOM
      </Button>
      <span :class="workbench.status">Na tela: <b ref="onScreen">{{ count }}</b></span>
    </div>
    <ul class="m-0 min-h-24 rounded-md bg-code px-3 py-2.5 font-mono text-[.8rem] text-code-foreground" aria-live="polite">
      <template v-if="log.length">
        <li v-for="[k, v] in log" :key="k" class="py-0.5">
          {{ k }}: <b class="text-tome">{{ v }}</b>
        </li>
      </template>
      <li v-else class="py-0.5">
        Clique no botão. Os três incrementos geram um único render, aplicado no próximo tick.
      </li>
    </ul>
  </div>
</template>
