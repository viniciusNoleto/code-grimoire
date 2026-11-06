<script setup lang="ts">
// A abertura do grimório: o livro já aberto sobre a mesa. Na página da
// esquerda, a folha de rosto e o círculo de evocação; na da direita, o
// índice dos tomos, cada um com o seu glifo. Apontar (ou focar) um tomo
// invoca o glifo dele no círculo da página ao lado; clicar solta a magia.
import type { Division } from '~/composables/useTree'

const { data: tree } = await useTree()
const { open: openSearch } = useSearch()
const { toggle: toggleTheme } = useTheme()
const isMac = ref(false)

const chapterCount = (d: Division) => d.tomes.reduce((s, t) => s + t.chapters.length, 0)
const total = computed(() => tree.value.reduce((s, d) => s + chapterCount(d), 0))
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

// o tomo invocado no círculo; sem nenhum, o sigilo do grimório
const active = ref<Division | null>(null)
let releaseTimer: ReturnType<typeof setTimeout> | undefined
function summon(d: Division) {
  clearTimeout(releaseTimer)
  active.value = d
}
function dismiss() {
  // um respiro: passar de um tomo ao vizinho não pisca o sigilo no meio
  clearTimeout(releaseTimer)
  releaseTimer = setTimeout(() => { active.value = null }, 140)
}
const colorsOf = (d: Division) => ({ '--tome-day': d.color ?? '#6d5a43', '--tome-night': d.colorDark ?? d.color ?? '#d9b98a' })
// sem tomo invocado, o círculo fica dourado e a fita, vermelha
const circleColor = computed(() => (active.value ? colorsOf(active.value) : { '--tome': 'var(--gold)' }))
const ribbonColor = computed(() => (active.value ? colorsOf(active.value) : { '--tome': 'var(--color-ribbon)' }))

onMounted(() => { isMac.value = /Mac|iPhone|iPad/.test(navigator.platform) })
onBeforeUnmount(() => clearTimeout(releaseTimer))

useHead({ bodyAttrs: { class: 'bg-desk px-4 max-sm:px-3' } })
useSeoMeta({
  title: 'Grimório de código',
  description: 'O grimório de código de Vinícius Nolêto: Vue, Nuxt, React, Next.js, Laravel, a plataforma web e o SQL estudados por dentro, como referência contínua.',
})
</script>

<template>
  <main id="content" class="grid min-h-svh place-items-center py-(--margin) [--margin:clamp(16px,2.4vw,32px)] max-book:place-items-start">
    <!-- o livro: a capa de couro aparece em volta das duas páginas -->
    <div class="relative grid min-h-[min(860px,calc(100svh-2*var(--margin)))] w-[min(1320px,100%)] grid-cols-2 rounded-[10px] bg-leather p-3 max-book:mb-11 max-book:min-h-0 max-book:grid-cols-1 max-book:gap-y-2 max-book:p-2">
      <!-- página da esquerda: a folha de rosto -->
      <header
        class="paper-grain relative grid min-w-0 origin-right grid-rows-[auto_1fr] gap-[clamp(32px,5vh,56px)] rounded-l-md border-l-6 border-page-edges py-[clamp(40px,6vh,72px)] pr-[clamp(44px,5.4vw,88px)] pl-[clamp(28px,4.4vw,72px)] after:pointer-events-none after:absolute after:inset-y-0 after:right-0 after:w-[22px] after:bg-fold js:motion-safe:animate-open-verso max-book:gap-9 max-book:rounded-md max-book:border-l-0 max-book:px-6 max-book:pt-10 max-book:pb-9 max-book:after:hidden max-book:js:motion-safe:animate-rise"
      >
        <div>
          <h1 class="m-0 font-book text-[clamp(3rem,6.2vw,6.25rem)] leading-[.92] font-normal tracking-[-.02em] text-balance text-foreground js:motion-safe:animate-rise [animation-delay:.25s] max-xs:text-[2.9rem]">
            Grimório de código
          </h1>
          <p class="mt-4 font-book text-[clamp(1.2rem,1.7vw,1.5rem)] text-gold italic js:motion-safe:animate-rise [animation-delay:.33s]">
            de Vinícius Nolêto
          </p>
          <p class="mt-[22px] max-w-[40ch] text-[1.08rem] leading-[1.55] js:motion-safe:animate-rise [animation-delay:.41s]">
            O que eu estudei de cada framework, escrito para ler do começo ao fim ou consultar no meio do trabalho.
          </p>
          <button
            type="button"
            class="mt-[26px] inline-flex cursor-pointer items-center gap-3.5 rounded-full bg-foreground py-[11px] pr-[11px] pl-[22px] font-medium text-background transition-[background-color,scale] duration-200 ease-grimoire hover:bg-[color-mix(in_srgb,var(--foreground)_84%,var(--gold))] active:scale-[.97] js:motion-safe:animate-rise [animation-delay:.49s]"
            @click="openSearch"
          >
            Buscar em {{ total }} capítulos <kbd class="rounded-full bg-background/18 px-2.5 py-[3px] text-[.8rem] text-background">{{ isMac ? '⌘' : 'Ctrl' }} K</kbd>
          </button>
        </div>

        <!-- o círculo de evocação: o glifo do tomo apontado aparece aqui -->
        <div
          class="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-[clamp(20px,2.6vw,36px)] self-end text-tome js:motion-safe:animate-rise [animation-delay:.6s] max-book:grid-cols-[120px_minmax(0,1fr)] max-book:items-start max-xs:grid-cols-1"
          :data-tome="active ? '' : undefined"
          :style="circleColor"
          aria-live="polite"
        >
          <div class="relative aspect-square w-[clamp(170px,17vw,240px)] max-book:w-[120px] max-xs:w-[148px]">
            <svg
              class="absolute inset-0 size-full fill-none stroke-current opacity-70 [stroke-width:1.1]"
              :class="{ 'motion-safe:animate-revolve': active }"
              viewBox="-60 -60 120 120"
              aria-hidden="true"
            >
              <circle r="57" />
              <circle r="49" />
              <path v-for="k in 24" :key="k" :d="k % 2 ? 'M0 -57 V-52' : 'M0 -57 V-54'" :transform="`rotate(${k * 15})`" />
            </svg>
            <Glyph :key="active?.path ?? 'grimoire'" :spell="active?.spell" :ring="false" trace :weight="1.5" class="absolute inset-[22%] size-[56%]" />
          </div>
          <p class="m-0 min-h-[6.2em] max-w-[34ch] text-base leading-[1.55] text-foreground max-book:min-h-0">
            <template v-if="active">
              <strong class="mb-1.5 block font-book text-[1.6rem] leading-[1.15] font-normal text-tome max-book:text-[1.35rem]">{{ active.title }}.</strong> {{ active.description }}
            </template>
            <template v-else>
              <strong class="mb-1.5 block font-book text-[1.6rem] leading-[1.15] font-normal text-tome max-book:text-[1.35rem]">{{ plural(tree.length, 'tomo', 'tomos') }}, {{ total }} capítulos.</strong>
              Cada tomo tem o seu glifo e a sua magia: plantas, ácido, gelo, fumaça, brasas, raio e rocha.
            </template>
          </p>
        </div>
      </header>

      <!-- página da direita: o índice dos tomos -->
      <nav
        class="paper-grain relative flex min-w-0 origin-left flex-col rounded-r-md border-r-6 border-page-edges py-[clamp(40px,6vh,72px)] pr-[clamp(28px,4.4vw,72px)] pl-[clamp(44px,5.4vw,88px)] before:pointer-events-none before:absolute before:inset-y-0 before:left-0 before:w-[22px] before:bg-fold js:motion-safe:animate-open-recto max-book:rounded-md max-book:border-r-0 max-book:px-6 max-book:pt-9 max-book:pb-9 max-book:before:hidden max-book:js:motion-safe:animate-rise"
        aria-labelledby="tomes-title"
      >
        <Button
          variant="ghost"
          size="icon"
          class="absolute top-[clamp(20px,3vh,32px)] right-[clamp(20px,2.6vw,36px)] size-10 rounded-full hover:bg-fold active:scale-[.94] max-book:top-[22px] max-book:right-4"
          aria-label="Alternar tema claro e escuro"
          @click="toggleTheme"
        >
          <Icon name="lucide:moon" class="size-[19px]" />
        </Button>
        <h2
          id="tomes-title"
          class="mb-[clamp(20px,3.4vh,36px)] font-book text-[clamp(2.2rem,3.4vw,3.25rem)] leading-none font-normal tracking-[-.01em] text-foreground js:motion-safe:animate-rise [animation-delay:.3s]"
        >
          Os tomos
        </h2>
        <ul class="-mx-4 grid flex-1 content-evenly gap-1 max-book:-mx-3 max-book:gap-0.5">
          <li v-for="(d, i) in tree" :key="d.path" class="js:motion-safe:animate-rise" :style="{ animationDelay: `${0.4 + Math.min(i, 5) * 0.08}s` }">
            <NuxtLink
              :to="d.path"
              class="group grid grid-cols-[clamp(56px,5.2vw,72px)_minmax(0,1fr)] items-center gap-[clamp(16px,1.8vw,24px)] rounded-lg px-4 py-3 text-foreground no-underline transition-[background-color,scale] duration-200 ease-grimoire hover:bg-tome-soft focus-visible:bg-tome-soft active:scale-[.985] max-book:items-start max-book:p-3"
              :class="{ 'bg-tome-soft': active?.path === d.path }"
              data-tome
              :data-spell="d.spell"
              :style="colorsOf(d)"
              @mouseenter="summon(d)"
              @mouseleave="dismiss"
              @focus="summon(d)"
              @blur="dismiss"
            >
              <Glyph
                :key="active?.path === d.path ? 'live' : 'still'"
                :spell="d.spell"
                :trace="active?.path === d.path"
                class="h-auto w-full text-tome transition-transform duration-450 ease-grimoire group-hover:scale-106 group-hover:-rotate-8 group-focus-visible:scale-106 group-focus-visible:-rotate-8"
              />
              <span>
                <span class="block font-book text-[clamp(1.75rem,2.4vw,2.3rem)] leading-[1.05] text-tome">{{ d.title }}</span>
                <span class="mt-1 block text-[.95rem] leading-[1.4] text-muted-foreground tabular-nums">
                  {{ d.tomes.map(t => t.title).join(' · ') }} · {{ plural(chapterCount(d), 'capítulo', 'capítulos') }}
                </span>
                <!-- sem cursor para apontar (telas estreitas), a descrição aparece na própria entrada -->
                <span class="sr-only max-book:not-sr-only max-book:mt-1.5 max-book:block max-book:text-base max-book:leading-normal max-book:text-foreground">{{ d.description }}</span>
              </span>
            </NuxtLink>
          </li>
        </ul>
      </nav>

      <!-- a fita marcadora sai da lombada e cai sobre a borda; toma a cor do tomo apontado -->
      <span
        class="ribbon-clip absolute bottom-[-42px] left-[calc(50%+14px)] h-[120px] w-5 origin-top bg-tome transition-colors duration-350 js:motion-safe:animate-drop-ribbon max-book:right-10 max-book:bottom-[-40px] max-book:left-auto max-book:h-[92px]"
        aria-hidden="true"
        :data-tome="active ? '' : undefined"
        :style="ribbonColor"
      />
    </div>
  </main>
</template>
