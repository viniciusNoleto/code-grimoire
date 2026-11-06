<script setup lang="ts">
// Dois "contextos", cada um com a sua instância de BroadcastChannel no mesmo canal.
// Abrir esta página em outra aba cria mais contextos no mesmo canal.
interface BrowsingContext { name: string, qty: number, notes: string[], channel: BroadcastChannel | null }

const isSupported = typeof BroadcastChannel !== 'undefined'
const contexts = reactive<BrowsingContext[]>(['A', 'B'].map(name => ({ name, qty: 0, notes: ['canal "carrinho-demo" aberto'], channel: null })))

function note(c: BrowsingContext, t: string) { c.notes = [t, ...c.notes].slice(0, 5) }

onMounted(() => {
  if (!isSupported) return
  for (const c of contexts) {
    const channel = markRaw(new BroadcastChannel('carrinho-demo'))
    channel.onmessage = (e: MessageEvent<{ from: string, qty: number }>) => {
      c.qty = e.data.qty
      note(c, `recebi de ${e.data.from}: qtd = ${e.data.qty}`)
    }
    c.channel = channel
  }
})
onBeforeUnmount(() => contexts.forEach(c => c.channel?.close()))

function addItem(c: BrowsingContext) {
  c.qty++
  c.channel?.postMessage({ from: c.name, qty: c.qty })
  note(c, `enviei: qtd = ${c.qty}`)
}
</script>

<template>
  <p v-if="!isSupported" :class="workbench.hint">
    BroadcastChannel não está disponível neste navegador.
  </p>
  <div v-else :class="workbench.columns">
    <div v-for="c in contexts" :key="c.name" :class="workbench.panel">
      <h4 :class="workbench.panelTitle">
        Contexto {{ c.name }}
      </h4>
      <div class="grid content-start gap-2 p-3">
        <Button type="button" size="sm" @click="addItem(c)">
          Adicionar item ao carrinho
        </Button>
        <p :class="workbench.status" class="m-0">
          Itens no carrinho (visão de {{ c.name }}): <b class="text-tome">{{ c.qty }}</b>
        </p>
        <ol class="m-0 min-h-28 rounded-md bg-code px-3 py-2.5 font-mono text-[.78rem] text-code-foreground" aria-live="polite">
          <li v-for="(n, i) in c.notes" :key="i" class="py-0.5">
            {{ n }}
          </li>
        </ol>
      </div>
    </div>
  </div>
</template>
