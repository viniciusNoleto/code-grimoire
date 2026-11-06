<script setup lang="ts">
// Um fluxo em caixas, da esquerda para a direita, com faixas rotulando trechos
// e uma nota opcional embaixo de cada caixa (como nos diagramas das artifacts).
// Feito em HTML (não SVG) para que os textos quebrem linha dentro das caixas
// em vez de vazarem para fora delas.
interface Step { title: string, sub?: string, highlight?: boolean, note?: string }
interface Lane { label: string, from: number, to: number }
defineProps<{ steps: Step[], lanes?: Lane[], label?: string }>()
</script>

<template>
  <div class="my-5 overflow-x-auto rounded-lg border border-border bg-card p-3" role="img" :aria-label="label ?? steps.map(p => p.title).join(', ')">
    <div
      class="grid grid-cols-[repeat(var(--n),minmax(0,1fr))] gap-x-(--arrow) p-0.5 [--arrow:18px]"
      :style="{ '--n': steps.length, 'minWidth': `calc(${steps.length} * 108px + ${steps.length - 1} * 18px)` }"
    >
      <!-- faixa: o rótulo (quebra linha se precisar) e, embaixo, o colchete -->
      <div
        v-for="f in lanes ?? []"
        :key="f.label"
        class="row-start-1 mb-2 flex flex-col gap-1.5 self-end text-center font-mono text-[.74rem] leading-[1.3] text-tome after:h-2.5 after:rounded-t-sm after:border-[1.5px] after:border-b-0 after:border-tome"
        :style="{ gridColumn: `${f.from + 1} / ${f.to + 2}` }"
      >
        <span>{{ f.label }}</span>
      </div>
      <!-- a seta ocupa o vão entre uma caixa e a anterior -->
      <div
        v-for="(p, i) in steps"
        :key="p.title"
        class="relative row-start-2 flex min-h-[76px] flex-col items-center justify-center gap-1 rounded-lg border-[1.2px] px-1.5 py-2.5 text-center"
        :class="[
          p.highlight ? 'border-tome bg-tome-soft' : 'border-border bg-paper',
          i > 0 && 'before:absolute before:top-1/2 before:right-[calc(100%+7px)] before:h-[1.4px] before:w-[calc(var(--arrow)-9px)] before:-translate-y-1/2 before:bg-muted-foreground after:absolute after:top-1/2 after:right-[calc(100%+2px)] after:h-2 after:w-[7px] after:-translate-y-1/2 after:bg-muted-foreground after:[clip-path:polygon(0_0,100%_50%,0_100%)]',
        ]"
        :style="{ gridColumn: i + 1 }"
      >
        <strong class="font-display text-[.86rem] leading-[1.2] font-semibold break-words text-foreground">{{ p.title }}</strong>
        <span v-if="p.sub" class="text-[.74rem] leading-[1.35] wrap-anywhere text-muted-foreground hyphens-manual">{{ p.sub }}</span>
      </div>
      <p
        v-for="(p, i) in steps"
        v-show="p.note"
        :key="`note-${i}`"
        class="row-start-3 mt-2 text-center text-[.74rem] leading-[1.35] wrap-anywhere text-muted-foreground hyphens-manual"
        :style="{ gridColumn: i + 1 }"
      >
        {{ p.note }}
      </p>
    </div>
  </div>
</template>
