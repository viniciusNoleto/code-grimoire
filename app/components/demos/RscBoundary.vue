<script setup lang="ts">
// 'use client' propaga pelos imports; o que entra via children continua no servidor.
import { Checkbox } from '~/components/ui/checkbox'
interface TreeNode { id: string, name: string, desc: string, kb: number, parent: string | null, via: 'import' | 'children' | null, client: boolean }
const nodes = reactive<TreeNode[]>([
  { id: 'page', name: 'page.tsx', desc: 'busca o produto', kb: 0, parent: null, via: null, client: false },
  { id: 'header', name: 'Header', desc: 'logo e navegação', kb: 4, parent: 'page', via: 'import', client: false },
  { id: 'busca', name: 'CaixaDeBusca', desc: 'input com sugestões', kb: 18, parent: 'header', via: 'import', client: true },
  { id: 'info', name: 'InfoProduto', desc: 'título, fotos, preço', kb: 9, parent: 'page', via: 'import', client: false },
  { id: 'md', name: 'Markdown', desc: 'parser de markdown (lib pesada)', kb: 62, parent: 'info', via: 'import', client: false },
  { id: 'add', name: 'BotaoComprar', desc: 'onClick, carrinho', kb: 7, parent: 'info', via: 'import', client: true },
  { id: 'tabs', name: 'Tabs', desc: 'alterna abas com useState', kb: 5, parent: 'page', via: 'import', client: true },
  { id: 'aval', name: 'Avaliacoes', desc: 'lê o banco; passado como children de Tabs', kb: 14, parent: 'tabs', via: 'children', client: false },
])
const byId = Object.fromEntries(nodes.map(n => [n.id, n]))
const depth = (n: TreeNode): number => (n.parent ? depth(byId[n.parent]!) + 1 : 0)
function isClient(n: TreeNode): boolean {
  if (n.client) return true
  if (!n.parent || n.via === 'children') return false
  return isClient(byId[n.parent]!)
}
const rows = computed(() => nodes.map(n => ({ n, client: isClient(n), indent: depth(n) * 18 })))
const summary = computed(() => {
  const clientRows = rows.value.filter(r => r.client)
  return { kb: clientRows.reduce((s, r) => s + r.n.kb, 0), client: clientRows.length, server: nodes.length - clientRows.length }
})
</script>

<template>
  <div>
    <div class="grid gap-1.5">
      <div
        v-for="{ n, client, indent } in rows"
        :key="n.id"
        class="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2.5 rounded-md border px-2.5 py-1.5"
        :class="client ? 'border-client bg-client-soft' : 'border-border bg-card'"
        :style="{ marginLeft: `${indent}px` }"
      >
        <span class="min-w-0 font-mono text-[.82rem] wrap-anywhere">{{ n.via === 'children' ? '{children} ' : '' }}&lt;{{ n.name }}&gt; <small class="font-sans text-[.78rem] text-muted-foreground">{{ n.desc }}</small></span>
        <span :class="client ? workbench.client : workbench.server">{{ client ? 'client' : 'server' }}</span>
        <label v-if="n.id !== 'page'" class="inline-flex cursor-pointer items-center gap-1.5 font-mono text-[.72rem] whitespace-nowrap text-muted-foreground">
          <Checkbox v-model="n.client" class="data-[state=checked]:border-client data-[state=checked]:bg-client" />'use client'
        </label>
        <span v-else />
      </div>
    </div>
    <div class="mt-3 grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-2.5">
      <div :class="workbench.meter">
        <span :class="workbench.meterLabel">JS enviado ao navegador</span><b :class="workbench.meterValue">+{{ summary.kb }} kB</b>
      </div>
      <div :class="workbench.meter">
        <span :class="workbench.meterLabel">Server Components</span><b :class="workbench.meterValue">{{ summary.server }}</b>
      </div>
      <div :class="workbench.meter">
        <span :class="workbench.meterLabel">Client Components</span><b :class="workbench.meterValue">{{ summary.client }}</b>
      </div>
    </div>
  </div>
</template>
