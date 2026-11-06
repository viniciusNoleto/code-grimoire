<!-- As fases do React, no mesmo desenho dos diagramas de fluxo (FlowDiagram.vue). -->
<script setup lang="ts">
const steps = [
  { title: 'Gatilho', sub: 'setState, root.render', note: 'o React agenda, não executa já' },
  { title: 'Render', sub: 'chama componentes', highlight: true, note: 'nenhum efeito colateral permitido' },
  { title: 'Reconciliação', sub: 'diff com a árvore anterior', highlight: true },
  { title: 'Commit', sub: 'muta DOM, refs, layout fx', highlight: true, note: 'useLayoutEffect roda aqui, antes do paint' },
  { title: 'Paint', sub: 'navegador desenha' },
  { title: 'useEffect', sub: 'roda após o paint' },
]
const lanes = [
  { label: 'fase de render · pura, pode ser interrompida', from: 1, to: 2 },
  { label: 'commit · síncrono', from: 3, to: 3 },
]
</script>

<template>
  <FlowDiagram
    :steps="steps"
    :lanes="lanes"
    label="Pipeline de atualização do React: gatilho, render, reconciliação, commit, paint do navegador e useEffect"
  />
</template>
