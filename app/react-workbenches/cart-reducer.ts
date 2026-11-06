// Bancada "Reducer de carrinho" — useReducer de verdade.
// Os tipos das ações e as chaves do estado são os mesmos do capítulo de useReducer, que o leitor vê na tela.
import { createElement as h, useReducer, useState } from 'react'
import { workbench } from '~/utils/workbench'

interface CartItem { id: string, nome: string, preco: number, qtd: number }
interface CartState { itens: CartItem[], cupom: string | null }
type CartAction =
  | { type: 'item_adicionado', item: Omit<CartItem, 'qtd'> }
  | { type: 'item_removido', id: string }
  | { type: 'cupom_aplicado', codigo: string }
  | { type: 'carrinho_limpo' }

const catalog = [
  { id: 'tec', nome: 'Teclado', preco: 320 },
  { id: 'mou', nome: 'Mouse', preco: 150 },
  { id: 'mon', nome: 'Monitor', preco: 1290 },
]

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'item_adicionado': {
      const existing = state.itens.find(i => i.id === action.item.id)
      const itens = existing
        ? state.itens.map(i => (i.id === action.item.id ? { ...i, qtd: i.qtd + 1 } : i))
        : [...state.itens, { ...action.item, qtd: 1 }]
      return { ...state, itens }
    }
    case 'item_removido': return { ...state, itens: state.itens.filter(i => i.id !== action.id) }
    case 'cupom_aplicado': return { ...state, cupom: action.codigo }
    case 'carrinho_limpo': return { itens: [], cupom: null }
    default: return state
  }
}

const formatBrl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export function CartReducer() {
  const [state, baseDispatch] = useReducer(cartReducer, { itens: [{ id: 'tec', nome: 'Teclado', preco: 320, qtd: 1 }], cupom: null })
  const [history, setHistory] = useState<{ k: number, t: string }[]>([{ k: 0, t: '{ type: "item_adicionado", item: { id: "tec" } }  (exemplo inicial)' }])
  const dispatch = (action: CartAction) => {
    baseDispatch(action)
    const summary: Record<string, unknown> = { ...action }
    if ('item' in action) summary.item = { id: action.item.id }
    setHistory(l => [{ k: (l[0]?.k ?? 0) + 1, t: JSON.stringify(summary).replace(/"(\w+)":/g, '$1: ') }, ...l].slice(0, 12))
  }
  const subtotal = state.itens.reduce((s, i) => s + i.preco * i.qtd, 0)
  const total = state.cupom === 'DEV10' ? subtotal * 0.9 : subtotal
  return h('div', null,
    h('div', { className: workbench.buttons },
      catalog.map(p => h('button', { key: p.id, type: 'button', className: workbench.button(), onClick: () => dispatch({ type: 'item_adicionado', item: p }) }, `+ ${p.nome}`)),
      h('button', { type: 'button', className: workbench.button(), onClick: () => state.itens[0] && dispatch({ type: 'item_removido', id: state.itens[0].id }) }, 'Remover primeiro'),
      h('button', { type: 'button', className: workbench.button(true), onClick: () => dispatch({ type: 'cupom_aplicado', codigo: 'DEV10' }) }, 'Aplicar cupom DEV10'),
      h('button', { type: 'button', className: workbench.danger, onClick: () => dispatch({ type: 'carrinho_limpo' }) }, 'Limpar')),
    h('div', { className: workbench.columns },
      h('div', { className: workbench.panel }, h('h4', { className: workbench.panelTitle }, 'dispatch(ação)'),
        h('div', { className: workbench.panelBody }, history.map(l => h('div', { key: l.k, className: workbench.event }, l.t)))),
      h('div', { className: workbench.panel }, h('h4', { className: workbench.panelTitle }, `Estado · total ${formatBrl(total)}`),
        h('pre', { className: workbench.panelBody }, JSON.stringify(state, null, 2)))))
}
