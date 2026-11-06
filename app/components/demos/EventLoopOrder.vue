<script setup lang="ts">
// Executa de verdade: código síncrono, microtasks, task e requestAnimationFrame.
const code = [
  'console.log(\'A · síncrono\');',
  'setTimeout(() => console.log(\'B · setTimeout 0\'), 0);',
  'requestAnimationFrame(() => console.log(\'C · requestAnimationFrame\'));',
  'Promise.resolve().then(() => console.log(\'D · Promise.then\'));',
  'queueMicrotask(() => console.log(\'E · queueMicrotask\'));',
  '(async () => {',
  '  console.log(\'F · async, antes do await\');',
  '  await null;',
  '  console.log(\'G · async, depois do await\');',
  '})();',
  'console.log(\'H · síncrono, última linha\');',
].join('\n')

const KIND: Record<string, string> = {
  A: 'código síncrono', F: 'código síncrono', H: 'código síncrono',
  D: 'microtask', E: 'microtask', G: 'microtask',
  B: 'task (macrotask)', C: 'antes do próximo frame',
}
const lines = ref<{ txt: string, ms: string }[]>([])

function run() {
  const output: { txt: string, ms: string }[] = []
  lines.value = output
  const t0 = performance.now()
  const log = (txt: string) => { output.push({ txt, ms: (performance.now() - t0).toFixed(1) }); lines.value = [...output] }
  log('A · síncrono')
  setTimeout(() => log('B · setTimeout 0'), 0)
  requestAnimationFrame(() => log('C · requestAnimationFrame'))
  Promise.resolve().then(() => log('D · Promise.then'))
  queueMicrotask(() => log('E · queueMicrotask'))
  ;(async () => { log('F · async, antes do await'); await null; log('G · async, depois do await') })()
  log('H · síncrono, última linha')
}
</script>

<template>
  <div>
    <pre class="mb-3.5 overflow-x-auto rounded-md border border-border bg-code px-3 py-2.5 font-mono text-[.8rem] leading-relaxed text-code-foreground">{{ code }}</pre>
    <div :class="workbench.buttons">
      <Button type="button" size="sm" @click="run">
        Executar
      </Button>
    </div>
    <ol class="m-0 min-h-24 rounded-md bg-code px-3 py-2.5 font-mono text-[.8rem] text-code-foreground" aria-live="polite">
      <template v-if="lines.length">
        <li v-for="(l, i) in lines" :key="i" class="py-0.5">
          <b class="text-tome">{{ i + 1 }}. {{ l.txt }}</b> · {{ KIND[l.txt[0]!] }} · {{ l.ms }} ms
        </li>
      </template>
      <li v-else class="py-0.5">
        Tente prever a ordem e clique em Executar.
      </li>
    </ol>
  </div>
</template>
