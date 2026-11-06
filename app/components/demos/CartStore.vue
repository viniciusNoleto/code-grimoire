<script setup lang="ts">
// Um store no formato setup store do Pinia, feito só com ref e computed.
// As chaves do estado são as do capítulo, que o leitor vê no painel "state".
interface Product { id: string, nome: string, preco: number }
interface CartItem extends Product { qtd: number }

function createCartStore() {
  const itens = ref<CartItem[]>([{ id: 'tec', nome: 'Teclado', preco: 320, qtd: 1 }])
  const cupom = ref<string | null>(null)
  const log = ref<{ k: number, t: string }[]>([{ k: 0, t: 'adicionar({ id: "tec" })  (exemplo inicial)' }])
  let seq = 0
  const subtotal = computed(() => itens.value.reduce((s, i) => s + i.preco * i.qtd, 0))
  const total = computed(() => cupom.value === 'DEV10' ? subtotal.value * 0.9 : subtotal.value)
  const record = (t: string) => { log.value = [{ k: ++seq, t }, ...log.value].slice(0, 12) }

  function add(p: Product) {
    const existing = itens.value.find(i => i.id === p.id)
    if (existing) existing.qtd++
    else itens.value.push({ ...p, qtd: 1 })
    record(`adicionar({ id: "${p.id}" })`)
  }
  function removeFirst() {
    const id = itens.value[0]?.id
    if (!id) return
    itens.value = itens.value.filter(i => i.id !== id)
    record(`remover("${id}")`)
  }
  function applyCoupon(c: string) { cupom.value = c; record(`aplicarCupom("${c}")`) }
  function clear() { itens.value = []; cupom.value = null; record('limpar()') }

  return { itens, cupom, subtotal, total, log, add, removeFirst, applyCoupon, clear }
}

const catalog: Product[] = [{ id: 'tec', nome: 'Teclado', preco: 320 }, { id: 'mou', nome: 'Mouse', preco: 150 }, { id: 'mon', nome: 'Monitor', preco: 1290 }]
const store = createCartStore()
const { itens, cupom, total, log } = store
const formatBrl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const stateJson = computed(() => JSON.stringify({ itens: itens.value, cupom: cupom.value }, null, 2))
</script>

<template>
  <div>
    <div :class="workbench.buttons">
      <Button v-for="p in catalog" :key="p.id" type="button" size="sm" variant="outline" @click="store.add(p)">
        + {{ p.nome }}
      </Button>
      <Button type="button" size="sm" variant="outline" @click="store.removeFirst">
        Remover primeiro
      </Button>
      <Button type="button" size="sm" variant="outline" @click="store.applyCoupon('DEV10')">
        Aplicar cupom DEV10
      </Button>
      <button type="button" :class="workbench.danger" @click="store.clear">
        Limpar
      </button>
    </div>
    <div :class="workbench.columns">
      <div :class="workbench.panel">
        <h4 :class="workbench.panelTitle">
          actions chamadas
        </h4>
        <div :class="workbench.panelBody">
          <div v-for="l in log" :key="l.k" :class="workbench.event">
            {{ l.t }}
          </div>
        </div>
      </div>
      <div :class="workbench.panel">
        <h4 :class="workbench.panelTitle">
          state · total {{ formatBrl(total) }}
        </h4>
        <pre :class="workbench.panelBody">{{ stateJson }}</pre>
      </div>
    </div>
  </div>
</template>
