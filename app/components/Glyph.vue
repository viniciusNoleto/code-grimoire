<!--
  O glifo de cada tomo, desenhado a partir da magia do framework:
  folha sobre o V (plantas, Vue), gota no monte (ácido, Nuxt), cristal de
  seis braços (gelo, React), N que solta fumaça (fumaça, Next) e chama com
  brasas (brasas, Laravel) raio cortando colchetes angulares (raio, Web) e o cilindro do banco talhado em pedra, com uma rachadura (rocha, SQL). Sem magia, é o sigilo do próprio grimório: <0>,
  com o zero desenhado como um olho.

  Todos os traços têm pathLength="1": com a prop `trace` o glifo é escrito
  traço a traço, o anel primeiro (animação `trace` em app/assets/css/tailwind.css).
-->
<script setup lang="ts">
import type { Spell } from '~/utils/spells'

const props = withDefaults(
  defineProps<{ spell?: Spell, ring?: boolean, trace?: boolean, weight?: number }>(),
  { ring: true, trace: false, weight: 1.7 },
)

// cristal de gelo: seis braços com um galho em V perto da ponta
function crystal() {
  let d = ''
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3 - Math.PI / 2
    const p = (r: number, offset = 0) => {
      const x = Math.cos(a + offset) * r
      const y = Math.sin(a + offset) * r
      return `${x.toFixed(2)} ${y.toFixed(2)}`
    }
    d += `M${p(4.5)} L${p(17)} M${p(15, -0.38)} L${p(11)} L${p(15, 0.38)} `
  }
  return d.trim()
}

const STROKES: Record<Spell | 'grimoire', string[]> = {
  plants: [
    'M-14 -11 L0 15 L14 -11',
    'M-7 -11 L0 2 L7 -11',
    'M0 -5 C4.5 -8.5 4.5 -14.5 0 -18.5 C-4.5 -14.5 -4.5 -8.5 0 -5 Z',
    'M0 -7 V-16',
  ],
  acid: [
    'M-16 13 L0 -15 L16 13 Z',
    'M0 -3 C3 1.5 4.6 4 4.6 6.2 A4.6 4.6 0 0 1 -4.6 6.2 C-4.6 4 -3 1.5 0 -3 Z',
    'M-7 13 V17.5',
    'M5 13 V19',
  ],
  ice: [crystal(), 'M0 -4.5 L3.9 -2.25 L3.9 2.25 L0 4.5 L-3.9 2.25 L-3.9 -2.25 Z'],
  smoke: [
    'M-9 15 V-11 L9 13',
    'M9 13 V-11',
    'M9 -11 C9 -16 14 -17 15.5 -13.5 C17 -10 12.5 -8.5 12.5 -12',
    'M-9 -11 C-12 -14 -10 -18 -6.5 -17.5',
  ],
  embers: [
    'M0 16 C-8 16 -11 10 -10 4 C-9 -2 -4 -5 -3 -13 C1 -9 2.5 -5 1.2 -1 C4 -3 5 -6 5 -9.5 C9.5 -5 11 1 10 6 C9 12 5 16 0 16 Z',
    'M0 16 C-3.5 16 -5 12.5 -4 9.5 C-3 6.5 -0.5 5.5 0 2 C3 5 4.2 8 3.4 11 C2.7 14 1.5 16 0 16 Z',
    'M-15 -6 l1 1',
    'M14 -12 l1 1',
    'M-11.5 -15 l.8 .8',
  ],
  lightning: [
    'M3 -17 L-7 2 L0.5 2 L-4 17 L8 -3 L0.5 -3 L5 -17 Z',
    'M-11 -8 L-18 0 L-11 8',
    'M13 -8 L19 0 L13 8',
  ],
  rock: [
    'M-13 -10 C-13 -15.5 13 -15.5 13 -10 C13 -4.5 -13 -4.5 -13 -10 Z',
    'M-13 -10 V10 C-13 15.5 13 15.5 13 10 V-10',
    'M-13 0 C-13 5.5 13 5.5 13 0',
    'M3 -5.2 L0.5 -1 L4 2.5 L1.5 7',
  ],
  // <0>: o zero bem redondo, com a pupila no meio, vira um olho entre os colchetes
  grimoire: [
    'M-11.5 -8 L-19 0 L-11.5 8',
    'M11.5 -8 L19 0 L11.5 8',
    'M0 -11 C5 -11 7.5 -6 7.5 0 C7.5 6 5 11 0 11 C-5 11 -7.5 6 -7.5 0 C-7.5 -6 -5 -11 0 -11 Z',
    'M0 -0.8 A0.8 0.8 0 1 1 0 0.8 A0.8 0.8 0 1 1 0 -0.8 Z',
  ],
}

const strokes = computed(() => STROKES[props.spell ?? 'grimoire'])
const strokeClass = computed(() => (props.trace ? 'motion-safe:animate-trace motion-safe:[stroke-dasharray:1_1]' : undefined))
// cada traço começa 110 ms depois do anterior
const delay = (i: number) => ({ animationDelay: `${(i + (props.ring ? 1 : 0)) * 110}ms` })
</script>

<template>
  <svg
    class="block overflow-visible fill-none stroke-current [stroke-linecap:round] [stroke-linejoin:round]"
    :style="{ strokeWidth: weight }"
    viewBox="-24 -24 48 48"
    aria-hidden="true"
  >
    <circle v-if="ring" :class="strokeClass" :style="{ strokeWidth: weight * 0.76 }" r="22" pathLength="1" />
    <path v-for="(d, i) in strokes" :key="i" :class="strokeClass" :style="delay(i)" :d="d" pathLength="1" />
  </svg>
</template>
