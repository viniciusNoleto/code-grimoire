<script setup lang="ts">
// A bolinha anda por requestAnimationFrame: só se move se a main thread estiver livre.
const track = ref<HTMLDivElement>()
const ball = ref<HTMLDivElement>()
const n = ref(38)
const busy = ref(false)
const where = ref('aguardando')
const duration = ref('–')
const pause = ref('–')
const pauseIsBad = ref(false)
const result = ref('–')
const hasWorker = ref(true)

let x = 0, dir = 1, last = 0, longestPause = 0, measuring = false, frame = 0
let worker: Worker | null = null
const fibSrc = 'function fib(n){return n<2?n:fib(n-1)+fib(n-2)}'
// eslint-disable-next-line no-new-func
const fib = new Function(fibSrc + ';return fib')() as (n: number) => number

function animate(t: number) {
  const dt = last ? t - last : 16
  last = t
  if (measuring && dt > longestPause) longestPause = dt
  const w = (track.value?.clientWidth ?? 0) - 22
  x += dir * dt * 0.25
  if (x > w) { x = w; dir = -1 }
  if (x < 0) { x = 0; dir = 1 }
  if (ball.value) ball.value.style.transform = `translateX(${x}px)`
  frame = requestAnimationFrame(animate)
}

function start(place: string) {
  busy.value = true
  where.value = place
  duration.value = 'calculando…'
  result.value = '…'
  pause.value = '…'
  pauseIsBad.value = false
  longestPause = 0
  measuring = true
}
function finish(r: number, ms: number) {
  setTimeout(() => {
    measuring = false
    duration.value = `${Math.round(ms)} ms`
    result.value = r.toLocaleString('pt-BR')
    pause.value = `${Math.round(longestPause)} ms`
    pauseIsBad.value = longestPause > 50
    busy.value = false
  }, 120)
}
function runOnMain() {
  start('main thread')
  setTimeout(() => { const t = performance.now(); const r = fib(n.value); finish(r, performance.now() - t) }, 60)
}
function runOnWorker() {
  if (!worker) return
  start('Worker')
  worker.postMessage(n.value)
}

onMounted(() => {
  frame = requestAnimationFrame(animate)
  try {
    const blob = new Blob([fibSrc + ';self.onmessage=function(e){var t=performance.now();var r=fib(e.data);self.postMessage({r:r,ms:performance.now()-t})}'], { type: 'text/javascript' })
    worker = new Worker(URL.createObjectURL(blob))
    worker.onmessage = (e: MessageEvent<{ r: number, ms: number }>) => finish(e.data.r, e.data.ms)
  }
  catch { hasWorker.value = false }
})
onBeforeUnmount(() => { cancelAnimationFrame(frame); worker?.terminate() })
</script>

<template>
  <div>
    <div ref="track" class="relative mb-3 h-[34px] overflow-hidden rounded-[17px] border border-border bg-paper" aria-hidden="true">
      <div ref="ball" class="absolute top-[5px] left-0 size-[22px] rounded-full bg-tome" />
    </div>
    <div :class="workbench.buttons">
      <label :class="workbench.status">
        <span>fib(n), n =</span>
        <select v-model.number="n" :class="workbench.button(false, 'pr-2')" :disabled="busy">
          <option :value="33">33</option><option :value="36">36</option><option :value="38">38</option><option :value="40">40</option>
        </select>
      </label>
      <Button type="button" size="sm" variant="outline" :disabled="busy" @click="runOnMain">
        Calcular na main thread
      </Button>
      <Button type="button" size="sm" :disabled="busy || !hasWorker" @click="runOnWorker">
        {{ hasWorker ? 'Calcular no Worker' : 'Worker indisponível aqui' }}
      </Button>
    </div>
    <dl :class="workbench.meters" aria-live="polite">
      <div :class="workbench.meter">
        <dt :class="workbench.meterLabel">Onde</dt><dd :class="workbench.meterValue">{{ where }}</dd>
      </div>
      <div :class="workbench.meter">
        <dt :class="workbench.meterLabel">Tempo de cálculo</dt><dd :class="workbench.meterValue">{{ duration }}</dd>
      </div>
      <div :class="workbench.meter">
        <dt :class="workbench.meterLabel">Maior pausa entre quadros</dt><dd :class="[workbench.meterValue, pauseIsBad && 'text-destructive']">{{ pause }}</dd>
      </div>
      <div :class="workbench.meter">
        <dt :class="workbench.meterLabel">Resultado</dt><dd :class="workbench.meterValue">{{ result }}</dd>
      </div>
    </dl>
  </div>
</template>
