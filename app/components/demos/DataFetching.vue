<script setup lang="ts">
// A mesma página de produtos escrita de quatro formas: quantas vezes a API é chamada?
type Side = 'server' | 'client'
type Step = [Side, string, boolean?]
interface Case { steps: Step[], metrics: [string, string, string, string] }
type Mode = 'fetch' | 'usefetch' | 'lazy' | 'client'
type Scenario = 'first' | 'nav'

const S: Side = 'server', C: Side = 'client'
const modes: Record<Mode, string> = { fetch: '$fetch no setup', usefetch: 'useFetch', lazy: 'useLazyFetch', client: 'useFetch server: false' }
const scenarios: Record<Scenario, string> = { first: 'Primeira visita (SSR)', nav: 'Navegação no cliente' }
const cases: Record<Mode, Record<Scenario, Case>> = {
  fetch: {
    first: { steps: [[S, 'setup roda: await $fetch(\'/api/produtos\')', true], [S, 'HTML renderizado com os produtos'], [S, 'payload enviado sem os produtos: $fetch não registra nada'], [C, 'hidratação: o setup roda de novo'], [C, 'await $fetch(\'/api/produtos\') outra vez', true], [C, 'se a resposta mudou entre as duas chamadas, hydration mismatch']], metrics: ['2', 'sim', '—', 'carga dobrada na API, risco de mismatch'] },
    nav: { steps: [[C, 'clique no NuxtLink'], [C, 'setup da nova página: await $fetch', true], [C, 'a navegação espera a resposta'], [C, 'página aparece. Sem chave: nada de deduplicação ou cache']], metrics: ['1', '—', 'sim', 'funciona, mas sem os recursos do useFetch'] },
  },
  usefetch: {
    first: { steps: [[S, 'setup: useFetch(\'/api/produtos\') busca', true], [S, 'HTML renderizado com os produtos'], [S, 'payload inclui o resultado sob a chave da chamada'], [C, 'hidratação: useFetch encontra a chave no payload'], [C, 'nenhuma requisição; data já está preenchido']], metrics: ['1', 'sim', '—', 'o padrão recomendado'] },
    nav: { steps: [[C, 'clique no NuxtLink'], [C, 'useFetch busca (com await)', true], [C, 'a navegação espera a resposta'], [C, 'página aparece já com dados']], metrics: ['1', '—', 'sim', 'sem estado de carregamento visível'] },
  },
  lazy: {
    first: { steps: [[S, 'setup: useLazyFetch busca', true], [S, 'no SSR o servidor espera mesmo assim'], [S, 'HTML com os produtos + payload'], [C, 'hidratação reaproveita o payload, sem nova requisição']], metrics: ['1', 'sim', '—', 'lazy não muda a primeira visita'] },
    nav: { steps: [[C, 'clique no NuxtLink'], [C, 'a navegação acontece na hora'], [C, 'status = \'pending\': mostra o skeleton'], [C, 'busca /api/produtos', true], [C, 'dados chegam e substituem o skeleton']], metrics: ['1', '—', 'não', 'precisa tratar o estado pending no template'] },
  },
  client: {
    first: { steps: [[S, 'setup: com server: false, nada é buscado'], [S, 'HTML com estado de carregamento, sem produtos'], [C, 'hidratação conclui'], [C, 'busca /api/produtos', true], [C, 'produtos aparecem depois; o HTML inicial não tinha o conteúdo']], metrics: ['1', 'não', '—', 'ruim para SEO e para a primeira pintura'] },
    nav: { steps: [[C, 'clique no NuxtLink'], [C, 'useFetch busca (com await)', true], [C, 'página aparece com dados']], metrics: ['1', '—', 'sim (com await)', 'igual ao useFetch na navegação'] },
  },
}
const metricLabels = ['Chamadas à API', 'Conteúdo no HTML inicial', 'Navegação espera?', 'Ponto de atenção']

const mode = ref<Mode>('fetch')
const scenario = ref<Scenario>('first')
const current = computed(() => cases[mode.value][scenario.value])
</script>

<template>
  <div>
    <div :class="workbench.buttons" role="group" aria-label="Forma de buscar">
      <Button v-for="(label, k) in modes" :key="k" type="button" size="sm" :variant="k === mode ? 'default' : 'outline'" :aria-pressed="k === mode" @click="mode = k">
        {{ label }}
      </Button>
    </div>
    <div :class="workbench.buttons" role="group" aria-label="Cenário">
      <Button v-for="(label, k) in scenarios" :key="k" type="button" size="sm" :variant="k === scenario ? 'default' : 'outline'" :aria-pressed="k === scenario" @click="scenario = k">
        {{ label }}
      </Button>
    </div>
    <dl :class="workbench.meters" aria-live="polite">
      <div v-for="(r, i) in metricLabels" :key="r" :class="workbench.meter">
        <dt :class="workbench.meterLabel">
          {{ r }}
        </dt>
        <dd :class="[workbench.meterValue, i === 0 && current.metrics[0] === '2' && 'text-destructive', i === 3 && 'font-sans text-[.88rem] font-medium']">
          {{ current.metrics[i] }}
        </dd>
      </div>
    </dl>
    <ol class="mt-3.5 grid gap-1.5">
      <li
        v-for="([side, text, req], i) in current.steps"
        :key="`${mode}-${scenario}-${i}`"
        class="grid grid-cols-[76px_minmax(0,1fr)_auto] items-center gap-2.5 rounded-md border bg-card px-2.5 py-[7px] text-[.88rem] max-sm:grid-cols-[70px_minmax(0,1fr)]"
        :class="req ? 'border-tome' : 'border-border'"
      >
        <span class="text-center" :class="workbench[side]">{{ side === 'server' ? 'servidor' : 'cliente' }}</span>
        <span>{{ text }}</span>
        <span v-if="req" class="font-mono text-[.68rem] whitespace-nowrap text-tome max-sm:col-start-2">requisição à API</span>
      </li>
    </ol>
  </div>
</template>
