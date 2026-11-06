// Bancada "Quem renderiza?" do tomo de Vue. Cada componente conta quantas vezes
// a própria render function rodou: por isso tudo aqui é escrito com h(), e não
// com template, para o contador ficar dentro do render.
import { defineComponent, h, inject, onUpdated, provide, reactive, ref, type Ref } from 'vue'
import { flash, workbench } from '~/utils/workbench'

/** Fábrica: componente que mostra nome, descrição e quantas vezes renderizou. */
function renderCounter(name: string, desc: string, props?: string[], read?: (p: Record<string, any>) => () => unknown) {
  return defineComponent({
    props: props ?? [],
    setup(p) {
      let n = 0
      const el = ref<HTMLElement | null>(null)
      const extra = read ? read(p) : null
      onUpdated(() => flash(el.value))
      return () => {
        n++
        const info = extra ? extra() : null
        return h('div', { class: workbench.box, ref: el }, [
          h('span', { class: workbench.boxName }, name),
          h('span', { class: workbench.boxDesc }, desc + (info != null && info !== '' ? ` ${info}` : '')),
          h('span', { class: workbench.boxCount }, `renders: ${n}`),
        ])
      }
    },
  })
}

const Static = renderCounter('<Estatico />', 'Sem props. Nunca renderiza de novo quando o pai renderiza.')
const WithValue = renderCounter('<ComValor :valor />', 'Prop primitiva. Renderiza quando o valor muda. Valor:', ['value'], p => () => p.value)
const WithInlineObject = renderCounter('<ComObjInline :opcoes="{ a: 1 }" />', 'Objeto criado no render do pai: nova referência a cada vez.', ['options'], () => () => '')
const ReadsTheme = renderCounter('<LeTema /> (inject)', 'Lê o tema injetado. Só ele atualiza ao alternar. Tema:', undefined, () => {
  const t = inject<Ref<string>>('theme')!
  return () => t.value
})
const ReadsField = renderCounter('<LeCampo :perfil />', 'Recebe o mesmo objeto reativo e lê perfil.pontos. Pontos:', ['profile'], p => () => p.profile.points)

export const WhoRendersVue = defineComponent({
  name: 'WhoRendersVue',
  setup() {
    const count = ref(0)
    const theme = ref('claro')
    const profile = reactive({ name: 'Ana', points: 0 })
    provide('theme', theme)
    const el = ref<HTMLElement | null>(null)
    let n = 0
    onUpdated(() => flash(el.value))
    return () => {
      n++
      return h('div', null, [
        h('div', { class: workbench.buttons }, [
          h('button', { type: 'button', class: workbench.button(true), onClick: () => count.value++ }, 'count++ no pai'),
          h('button', { type: 'button', class: workbench.button(), onClick: () => { theme.value = theme.value === 'claro' ? 'escuro' : 'claro' } }, 'Alternar tema (provide)'),
          h('button', { type: 'button', class: workbench.button(), onClick: () => profile.points++ }, 'perfil.pontos++'),
          h('button', { type: 'button', class: workbench.button(), onClick: () => { count.value = count.value } }, 'count = mesmo valor'),
        ]),
        h('div', { class: workbench.grid }, [
          h('div', { class: workbench.box, ref: el }, [
            h('span', { class: workbench.boxName }, '<App />'),
            h('span', { class: workbench.boxDesc }, `Lê só count no render (${count.value}). Fornece tema e perfil, mas não os lê.`),
            h('span', { class: workbench.boxCount }, `renders: ${n}`),
          ]),
          h(Static),
          h(WithValue, { value: count.value }),
          h(WithInlineObject, { options: { a: 1 } }),
          h(ReadsTheme),
          h(ReadsField, { profile }),
        ]),
      ])
    }
  },
})
