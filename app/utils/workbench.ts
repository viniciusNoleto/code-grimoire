// Classes do Tailwind compartilhadas pelas bancadas (demos ao vivo).
// Ficam aqui porque são usadas tanto nos componentes Vue quanto nas bancadas
// escritas em React (app/react-workbenches), que não podem usar componentes Vue.
// Os botões vêm do Button do shadcn-vue (buttonVariants).
import { cn } from 'cn'
import { buttonVariants } from '~/components/ui/button'

export const workbench = {
  /** linha de botões e controles */
  buttons: 'mb-3.5 flex flex-wrap items-center gap-2',
  /** botão de bancada; o ativo (ou a ação principal) fica preenchido */
  button: (active = false, extra?: string) => cn(buttonVariants({ variant: active ? 'default' : 'outline', size: 'sm' }), extra),
  /** botão de ação destrutiva */
  danger: cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'text-destructive hover:text-destructive'),
  /** texto de apoio */
  hint: 'mb-3 text-[.9rem] text-muted-foreground',
  /** dois painéis lado a lado */
  columns: 'grid grid-cols-2 gap-3 max-sm:grid-cols-1',
  panel: 'flex min-w-0 flex-col rounded-lg border border-border',
  panelTitle: 'border-b border-border px-3 py-2 font-sans text-[.72rem] font-semibold tracking-widest text-muted-foreground uppercase',
  panelBody: 'm-0 h-60 overflow-auto bg-code px-3 py-2.5 font-mono text-[.78rem] leading-normal break-words whitespace-pre-wrap text-code-foreground max-sm:h-44',
  /** uma linha de registro dentro de um painel */
  event: 'border-b border-dashed border-border py-1',
  /** medidores (dl) */
  meters: 'm-0 grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-2.5',
  meter: 'rounded-lg border border-border px-3 py-2',
  meterLabel: 'block text-[.72rem] tracking-widest text-muted-foreground uppercase',
  meterValue: 'm-0 font-mono text-[1.1rem] font-semibold tabular-nums',
  /** status em linha (relógio, conexão) */
  status: 'inline-flex items-center gap-1.5 font-mono text-[.8rem]',
  /** caixas de "Quem renderiza?" */
  grid: 'grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-2.5',
  box: 'grid min-w-0 content-start gap-0.5 rounded-lg border border-border bg-card px-3 py-2.5',
  boxName: 'font-mono text-[.8rem] font-semibold wrap-anywhere',
  boxDesc: 'text-[.8rem] leading-snug text-muted-foreground',
  boxCount: 'font-mono text-[.8rem] text-tome tabular-nums',
  /** classe posta e tirada para a caixa piscar quando renderiza */
  flash: 'animate-flash',
  /** etiquetas servidor / cliente */
  server: 'rounded-sm bg-tome-soft px-[7px] py-px font-mono text-[.76em] font-semibold whitespace-nowrap text-tome',
  client: 'rounded-sm bg-client-soft px-[7px] py-px font-mono text-[.76em] font-semibold whitespace-nowrap text-client',
}

/** Reinicia a animação de "acabou de renderizar" numa caixa. */
export function flash(el: HTMLElement | null) {
  if (!el) return
  el.classList.remove(workbench.flash)
  void el.offsetWidth
  el.classList.add(workbench.flash)
}
