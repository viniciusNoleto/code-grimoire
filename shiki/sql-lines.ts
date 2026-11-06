/**
 * Linhas de SQL gerado dentro de blocos PHP.
 *
 * No Markdown, qualquer linha de um bloco ```php que comece com `--` é o SQL
 * que a linha de PHP logo acima produz. Ela é retirada antes do PHP ser
 * colorido (para não confundir a gramática) e devolvida no mesmo lugar,
 * marcada com a classe `sql` e colorida por um tokenizador próprio que
 * destaca os bindings (`?`). As cores são classes do Tailwind (STYLE abaixo);
 * o Tailwind as encontra lendo este arquivo.
 *
 *   User::where('ativo', 1)->get();
 *   -- SQL: select * from "users" where "ativo" = ?
 *   -- → order by "nome" asc        (trecho que um método acrescenta)
 *   --      (observação em texto livre)
 */
import type { ShikiTransformer } from 'shiki'
import type { Element, ElementContent } from 'hast'

const MARKER = /^\s*--(?=\s|$)/
const LABEL = /^(SQL[^:]*:|→)/
const KEYWORDS = new Set(`select from where and or not order by asc desc limit offset insert into values update set delete
join inner left right outer cross on group having as in is null exists between like ilike union all distinct case when then
else end returning with recursive begin commit rollback savepoint release transaction for share lock nowait skip locked
conflict do nothing excluded default true false any some lateral nulls first last collate primary key create table alter
drop index unique references cascade constraint add column truncate`.split(/\s+/))
const SQL_START = /^(select|insert|update|delete|with|begin|commit|rollback|savepoint|release|alter|create|drop|set|where|and|or|order|group|limit|offset|inner|left|right|join|on|union|having|values|returning|from|exists|not|case|when|count|sum|truncate|lock|\(select|\*|"|\))/i
const TOKEN = /("(?:[^"]|"")*")|('(?:[^']|'')*')|(\?)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_][\w]*)(?=\s*\()|([A-Za-z_][\w]*)/g

// classes do Tailwind de cada pedaço da linha de SQL
const STYLE = {
  line: 'line sql block bg-sql-soft shadow-[inset_3px_0_0_var(--sql)] sql-hidden:hidden!',
  marker: 'text-comment opacity-70',
  label: 'font-semibold text-sql',
  note: 'text-comment italic',
  kw: 'font-semibold text-q-kw',
  id: 'text-q-id',
  str: 'text-q-str',
  num: 'text-q-num',
  fn: 'text-q-fn',
  bind: 'rounded-[3px] bg-q-bind-bg px-0.5 font-semibold text-q-bind',
}

const span = (cls: string, value: string): Element => ({
  type: 'element',
  tagName: 'span',
  properties: { class: cls },
  children: [{ type: 'text', value }],
})

function tokenize(sql: string): ElementContent[] {
  const out: ElementContent[] = []
  let last = 0
  for (const m of sql.matchAll(TOKEN)) {
    if (m.index > last) out.push({ type: 'text', value: sql.slice(last, m.index) })
    const [t, id, str, bind, num, fn, word] = m
    if (id) out.push(span(STYLE.id, t))
    else if (str) out.push(span(STYLE.str, t))
    else if (bind) out.push(span(STYLE.bind, t))
    else if (num) out.push(span(STYLE.num, t))
    else if (fn) out.push(span(KEYWORDS.has(fn.toLowerCase()) ? STYLE.kw : STYLE.fn, t))
    else if (word && KEYWORDS.has(word.toLowerCase())) out.push(span(STYLE.kw, t))
    else out.push({ type: 'text', value: t })
    last = m.index + t.length
  }
  if (last < sql.length) out.push({ type: 'text', value: sql.slice(last) })
  return out
}

function sqlLine(text: string): Element {
  const marker = text.match(/^\s*--\s*/)![0]
  let rest = text.slice(marker.length)
  const children: ElementContent[] = [span(STYLE.marker, marker)]
  const label = rest.match(LABEL)
  if (label) {
    children.push(span(STYLE.label, label[1]))
    rest = rest.slice(label[1].length)
  }
  const body = rest.trimStart()
  if (!label && body && !SQL_START.test(body)) children.push(span(STYLE.note, rest))
  else children.push(...tokenize(rest))
  return { type: 'element', tagName: 'span', properties: { class: STYLE.line }, children }
}

const isLine = (n: ElementContent): n is Element =>
  n.type === 'element' && String(n.properties?.class ?? '').split(' ').includes('line')

export function sqlLines(code: string, lang: string): ShikiTransformer[] {
  if (lang !== 'php' || !code.split('\n').some(l => MARKER.test(l))) return []
  const sql: { before: number, text: string }[] = []

  return [{
    name: 'grimoire:sql-lines',
    preprocess(source) {
      sql.length = 0
      const php: string[] = []
      for (const line of source.split('\n')) {
        if (MARKER.test(line)) sql.push({ before: php.length, text: line })
        else php.push(line)
      }
      return php.join('\n')
    },
    code(el) {
      const lines = el.children.filter(isLine)
      const separated = el.children.some(n => n.type === 'text')
      const trailingNewline = (() => {
        const last = lines[0]?.children.at(-1)
        return last?.type === 'element' && last.children.at(-1)?.type === 'text'
          && (last.children.at(-1) as { value: string }).value.endsWith('\n')
      })()
      const result: Element[] = []
      const insert = (i: number) => sql.filter(s => s.before === i).forEach((s) => {
        const l = sqlLine(s.text)
        if (trailingNewline) l.children.push({ type: 'text', value: '\n' })
        result.push(l)
      })
      lines.forEach((l, i) => { insert(i); result.push(l) })
      insert(lines.length)
      el.children = separated
        ? result.flatMap((l, i) => (i ? [{ type: 'text', value: '\n' } as ElementContent, l] : [l]))
        : result
      el.properties['data-sql'] = 'true'
    },
  }]
}
