<script setup lang="ts">
const props = defineProps<{ demo: string, title?: string }>()
const demos = {
  'who-renders': { c: defineAsyncComponent(() => import('../demos/WhoRenders.vue')), tag: 'React 19 ao vivo' },
  'slow-list': { c: defineAsyncComponent(() => import('../demos/SlowList.vue')), tag: 'React 19 ao vivo' },
  'cart-reducer': { c: defineAsyncComponent(() => import('../demos/CartReducer.vue')), tag: 'React 19 ao vivo' },
  'main-thread-vs-worker': { c: defineAsyncComponent(() => import('../demos/MainThreadVsWorker.vue')), tag: 'ao vivo' },
  'sse-simulator': { c: defineAsyncComponent(() => import('../demos/SseSimulator.vue')), tag: 'servidor simulado' },
  'route-explorer': { c: defineAsyncComponent(() => import('../demos/RouteExplorer.vue')), tag: 'interativo' },
  'rsc-boundary': { c: defineAsyncComponent(() => import('../demos/RscBoundary.vue')), tag: 'interativo' },
  'streaming-simulator': { c: defineAsyncComponent(() => import('../demos/StreamingSimulator.vue')), tag: 'simulação' },
  'route-rules': { c: defineAsyncComponent(() => import('../demos/RouteRules.vue')), tag: 'simulação' },
  'data-fetching': { c: defineAsyncComponent(() => import('../demos/DataFetching.vue')), tag: 'simulação' },
  'who-renders-vue': { c: defineAsyncComponent(() => import('../demos/WhoRendersVue.vue')), tag: 'Vue ao vivo' },
  'next-tick': { c: defineAsyncComponent(() => import('../demos/NextTick.vue')), tag: 'Vue ao vivo' },
  'cart-store': { c: defineAsyncComponent(() => import('../demos/CartStore.vue')), tag: 'Vue ao vivo' },
  'event-loop-order': { c: defineAsyncComponent(() => import('../demos/EventLoopOrder.vue')), tag: 'executa de verdade' },
  'http-cache-simulator': { c: defineAsyncComponent(() => import('../demos/HttpCacheSimulator.vue')), tag: 'simulação' },
  'cart-broadcast': { c: defineAsyncComponent(() => import('../demos/CartBroadcast.vue')), tag: 'ao vivo' },
  'intersection-observer': { c: defineAsyncComponent(() => import('../demos/IntersectionObserverDemo.vue')), tag: 'ao vivo' },
  'join-types': { c: defineAsyncComponent(() => import('../demos/JoinTypes.vue')), tag: 'interativo' },
  'window-functions': { c: defineAsyncComponent(() => import('../demos/WindowFunctions.vue')), tag: 'interativo' },
  'concurrent-sessions': { c: defineAsyncComponent(() => import('../demos/ConcurrentSessions.vue')), tag: 'simulação' },
  'lock-matrix': { c: defineAsyncComponent(() => import('../demos/LockMatrix.vue')), tag: 'matriz oficial' },
  'trigram-similarity': { c: defineAsyncComponent(() => import('../demos/TrigramSimilarity.vue')), tag: 'calculado como o pg_trgm' },
} as Record<string, { c: Component, tag: string }>
const current = computed(() => demos[props.demo])
</script>

<template>
  <div class="my-6 overflow-hidden rounded-[10px] border border-tome bg-card">
    <div class="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-tome-soft px-4 py-2.5">
      <b class="font-display text-base">Bancada: {{ title }}</b>
      <span class="font-mono text-[.7rem] tracking-[.12em] text-tome uppercase">{{ current?.tag ?? 'ao vivo' }}</span>
    </div>
    <div class="p-4">
      <p :class="workbench.hint">
        <slot mdc-unwrap="p" />
      </p>
      <ClientOnly>
        <component :is="current.c" v-if="current" />
        <template #fallback>
          <p :class="workbench.hint">
            Carregando a bancada…
          </p>
        </template>
      </ClientOnly>
    </div>
  </div>
</template>
