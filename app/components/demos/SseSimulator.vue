<script setup lang="ts">
// Um servidor falso escreve no fio; um parser com as regras do EventSource monta os eventos.
interface ReceivedEvent { k: number, type: string, id: string, data: string, isSystem?: boolean }
type Status = 'closed' | 'open' | 'reconnecting'
const STATUS_LABEL: Record<Status, string> = { closed: 'fechado', open: 'aberto', reconnecting: 'reconectando' }
const wire = ref('')
const events = ref<ReceivedEvent[]>([])
const status = ref<Status>('closed')
const wirePanel = ref<HTMLPreElement>()

let timer: ReturnType<typeof setInterval> | null = null
let retryTimer: ReturnType<typeof setTimeout> | null = null
let serverId = 0, lastEventId = '', retry = 3000, step = 0, seq = 0
const prices: Record<string, number> = { PETR4: 38.4, VALE3: 61.2 }
let buf = '', dataLines: string[] = [], eventType = ''

const isConnected = computed(() => status.value === 'open')

async function scrollWire() { await nextTick(); if (wirePanel.value) wirePanel.value.scrollTop = wirePanel.value.scrollHeight }
function systemMessage(t: string) { events.value = [{ k: ++seq, type: '', id: '', data: t, isSystem: true }, ...events.value].slice(0, 40) }
function write(t: string) { wire.value += t; scrollWire(); parse(t) }

function parse(chunk: string) {
  buf += chunk
  let i
  while ((i = buf.indexOf('\n')) >= 0) {
    const line = buf.slice(0, i)
    buf = buf.slice(i + 1)
    if (line === '') { dispatch(); continue }
    if (line[0] === ':') continue
    const c = line.indexOf(':')
    const field = c < 0 ? line : line.slice(0, c)
    let value = c < 0 ? '' : line.slice(c + 1)
    if (value[0] === ' ') value = value.slice(1)
    if (field === 'data') dataLines.push(value)
    else if (field === 'event') eventType = value
    else if (field === 'id') lastEventId = value
    else if (field === 'retry' && /^\d+$/.test(value)) retry = +value
  }
}
function dispatch() {
  if (dataLines.length) events.value = [{ k: ++seq, type: eventType || 'message', id: lastEventId, data: dataLines.join('\\n') }, ...events.value].slice(0, 40)
  dataLines = []
  eventType = ''
}

function tick() {
  step++
  if (step % 5 === 0) { write(': ping\n\n'); return }
  serverId++
  if (step % 7 === 0) { write(`id: ${serverId}\nevent: pedido\ndata: pedido #${1000 + serverId}\ndata: status: enviado\n\n`); return }
  const ticker = step % 2 ? 'PETR4' : 'VALE3'
  prices[ticker] = +(prices[ticker]! + (Math.random() - 0.5) * 0.4).toFixed(2)
  write(`id: ${serverId}\nevent: preco\ndata: {"ativo":"${ticker}","valor":${prices[ticker]}}\n\n`)
}
function connect(isReconnect: boolean) {
  buf = ''
  wire.value += isReconnect && lastEventId ? `\n→ GET /stream  Last-Event-ID: ${lastEventId}\n` : '→ GET /stream\n'
  wire.value += '← 200 text/event-stream\n\n'
  if (isReconnect) { serverId = +lastEventId; systemMessage(`reconectado; o servidor retoma depois do id ${lastEventId}`) }
  else write('retry: 3000\n\n')
  status.value = 'open'
  timer = setInterval(tick, 900)
  tick()
}
function stop() {
  if (timer) clearInterval(timer)
  if (retryTimer) clearTimeout(retryTimer)
  timer = retryTimer = null
}
function toggle() {
  if (status.value !== 'closed') {
    stop()
    status.value = 'closed'
    wire.value += '\n[o cliente chamou es.close(); sem reconexão]\n'
    scrollWire()
  }
  else {
    wire.value = ''
    events.value = []
    serverId = 0; lastEventId = ''; step = 0
    connect(false)
  }
}
function dropConnection() {
  if (!isConnected.value) return
  stop()
  wire.value += '\n[a conexão caiu: erro de rede]\n'
  scrollWire()
  systemMessage(`onerror · readyState = CONNECTING · nova tentativa em ${retry} ms`)
  status.value = 'reconnecting'
  retryTimer = setTimeout(() => { retryTimer = null; connect(true) }, retry)
}
onBeforeUnmount(stop)
</script>

<template>
  <div>
    <div :class="workbench.buttons">
      <Button type="button" size="sm" @click="toggle">
        {{ status === 'closed' ? 'Conectar' : 'Fechar (es.close())' }}
      </Button>
      <button type="button" :class="workbench.danger" :disabled="!isConnected" @click="dropConnection">
        Derrubar a conexão
      </button>
      <span :class="workbench.status" role="status">
        <i class="size-2 rounded-full" :class="status === 'open' ? 'bg-ok' : status === 'reconnecting' ? 'bg-warning' : 'bg-muted-foreground'" />{{ STATUS_LABEL[status] }}
      </span>
    </div>
    <div :class="workbench.columns">
      <div :class="workbench.panel">
        <h4 :class="workbench.panelTitle">
          Bytes no fio
        </h4>
        <pre ref="wirePanel" :class="workbench.panelBody">{{ wire }}</pre>
      </div>
      <div :class="workbench.panel">
        <h4 :class="workbench.panelTitle">
          Eventos recebidos pelo seu código
        </h4>
        <div :class="workbench.panelBody">
          <div v-for="e in events" :key="e.k" :class="[workbench.event, e.isSystem && 'text-destructive']">
            <template v-if="!e.isSystem">
              <b class="text-tome">{{ e.type }}</b> lastEventId={{ e.id }}<br>{{ e.data }}
            </template>
            <template v-else>
              {{ e.data }}
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
