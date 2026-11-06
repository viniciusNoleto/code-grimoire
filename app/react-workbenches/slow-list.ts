// Bancada "Digitação com uma lista lenta" — useTransition e useDeferredValue de verdade.
import { createElement as h, memo, useDeferredValue, useState, useTransition } from 'react'
import { workbench } from '~/utils/workbench'

type Mode = 'normal' | 'transition' | 'deferred'

function SlowRow({ i, q }: { i: number, q: string }) {
  const t = performance.now()
  while (performance.now() - t < 1) { /* simula um render caro */ }
  return h('li', { className: 'border-b border-border px-2.5 py-[3px]' }, `Resultado ${i + 1} para "${q}"`)
}

const SlowList = memo(({ q }: { q: string }) =>
  h('ul', { className: 'm-0 h-45 overflow-auto rounded-md border border-border bg-code font-mono text-[.76rem] text-code-foreground' }, Array.from({ length: 200 }, (_, i) => h(SlowRow, { key: i, i, q }))))

const modes: [Mode, string][] = [['normal', 'setState normal'], ['transition', 'startTransition'], ['deferred', 'useDeferredValue']]

export function SlowListLab() {
  const [mode, setMode] = useState<Mode>('normal')
  const [text, setText] = useState('react')
  const [query, setQuery] = useState('react')
  const [isPending, startTransition] = useTransition()
  const deferred = useDeferredValue(text)

  function onInput(e: { target: HTMLInputElement }) {
    const v = e.target.value
    setText(v)
    if (mode === 'normal') setQuery(v)
    else if (mode === 'transition') startTransition(() => setQuery(v))
  }

  const q = mode === 'deferred' ? deferred : query
  const isBehind = mode === 'deferred' ? text !== deferred : mode === 'transition' ? isPending : false

  return h('div', null,
    h('div', { className: workbench.buttons, role: 'group', 'aria-label': 'Modo' },
      modes.map(([m, label]) => h('button', {
        key: m, type: 'button', className: workbench.button(mode === m), 'aria-pressed': mode === m,
        onClick: () => { setMode(m); setQuery(text) },
      }, label))),
    h('label', { htmlFor: 'slow-list-search', className: 'block text-[.9rem] text-muted-foreground' }, 'Busca'),
    h('input', { id: 'slow-list-search', className: 'mt-1 mb-2 h-10 w-full rounded-md border border-input bg-card px-2.5 text-base shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50', value: text, onChange: onInput, autoComplete: 'off' }),
    h('div', { className: 'mb-2 flex flex-wrap gap-3.5 font-mono text-[.78rem] text-muted-foreground' },
      h('span', null, `input: "${text}"`),
      h('span', null, `lista renderizada com: "${q}"`),
      isBehind ? h('b', { className: 'text-trap' }, 'lista atrasada (renderizando em segundo plano)') : h('span', null, 'em dia')),
    h(SlowList, { q }))
}
