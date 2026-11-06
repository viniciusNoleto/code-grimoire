// Bancada "Quem renderiza?" — React de verdade, sem JSX para não exigir outro compilador.
import { createContext, createElement as h, memo, useCallback, useContext, useEffect, useRef, useState } from 'react'
import type { ReactNode, RefObject } from 'react'
import { flash, workbench } from '~/utils/workbench'

function useRenders(): [number, RefObject<HTMLDivElement | null>] {
  const n = useRef(0)
  n.current++
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => flash(ref.current))
  return [n.current, ref]
}

function Box({ name, desc, n, boxRef, children }: { name: string, desc: string, n: number, boxRef: RefObject<HTMLDivElement | null>, children?: ReactNode }) {
  return h('div', { className: workbench.box, ref: boxRef },
    h('span', { className: workbench.boxName }, name),
    h('span', { className: workbench.boxDesc }, desc),
    h('span', { className: workbench.boxCount }, `renders: ${n}`),
    children)
}

const ThemeContext = createContext('claro')

function Plain() { const [n, r] = useRenders(); return h(Box, { name: '<Comum />', desc: 'Sem memo. Renderiza sempre que o pai renderiza.', n, boxRef: r }) }
const Memoized = memo(function Memoized(_: { label: string }) { const [n, r] = useRenders(); return h(Box, { name: 'memo(<Memo rotulo />)', desc: 'Prop string estável. Pulado pelo memo.', n, boxRef: r }) })
const MemoInline = memo(function MemoInline(_: { style: object }) { const [n, r] = useRenders(); return h(Box, { name: 'memo(<MemoInline estilo={{}} />)', desc: 'Objeto inline: referência nova a cada render. Memo inútil.', n, boxRef: r }) })
const MemoCallback = memo(function MemoCallback(_: { onClick: () => void }) { const [n, r] = useRenders(); return h(Box, { name: 'memo(<MemoCb onClick />)', desc: 'Função via useCallback. Referência estável, memo funciona.', n, boxRef: r }) })
const Consumer = memo(function Consumer() { const t = useContext(ThemeContext); const [n, r] = useRenders(); return h(Box, { name: 'memo(<Consumidor />)', desc: `Lê o contexto Tema (${t}). Memo não bloqueia contexto.`, n, boxRef: r }) })
function Child() { const [n, r] = useRenders(); return h(Box, { name: '<Filho /> via children', desc: 'Criado pelo App. Não renderiza quando o Slot muda.', n, boxRef: r }) }
function Slot({ children }: { children: ReactNode }) {
  const [v, setV] = useState(0)
  const [n, r] = useRenders()
  return h('div', { className: 'col-span-full grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-2 rounded-lg border border-dashed border-muted-foreground p-2.5' },
    h(Box, { name: '<Slot>{children}</Slot>', desc: `Tem estado próprio: ${v}`, n, boxRef: r },
      h('button', { className: workbench.button(false, 'mt-1.5 justify-self-start'), type: 'button', onClick: () => setV(x => x + 1) }, '+1 no estado do Slot')),
    children)
}

export function WhoRenders() {
  const [count, setCount] = useState(0)
  const [theme, setTheme] = useState('claro')
  const [n, r] = useRenders()
  const cb = useCallback(() => {}, [])
  return h(ThemeContext.Provider, { value: theme },
    h('div', { className: workbench.buttons },
      h('button', { className: workbench.button(true), type: 'button', onClick: () => setCount(c => c + 1) }, '+1 no estado do App'),
      h('button', { className: workbench.button(), type: 'button', onClick: () => setTheme(t => (t === 'claro' ? 'escuro' : 'claro')) }, 'Alternar contexto Tema'),
      h('button', { className: workbench.button(), type: 'button', onClick: () => setCount(c => c) }, 'setState com o mesmo valor')),
    h('div', { className: workbench.grid },
      h(Box, { name: '<App />', desc: `Dono do estado: count = ${count}, tema = ${theme}`, n, boxRef: r }),
      h(Plain), h(Memoized, { label: 'fixo' }), h(MemoInline, { style: {} }), h(MemoCallback, { onClick: cb }), h(Consumer),
      h(Slot, null, h(Child))))
}
