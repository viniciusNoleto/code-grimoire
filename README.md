# Grimório de código

Meu agregador de conhecimento: o que eu estudo de cada tecnologia, escrito como referência. Cada framework (Laravel, React…) tem uma abertura com o sumário e **uma página por capítulo**, com o índice lateral marcando o capítulo aberto. Não existe painel nem formulário: todo o conteúdo mora no repositório, em Markdown, e o site é gerado estático.

Feito com Nuxt 4 e Nuxt Content 3.

```bash
npm install
npm run dev        # http://localhost:3000
npm run generate   # site estático em .output/public
```

## Docker e deploy

O `Makefile` escolhe o `docker-compose.<APP_ENV>.yml` pelo `APP_ENV` do `.env`.

**Local** (servidor de desenvolvimento do Nuxt, com o projeto montado por volume):

```bash
cp .env.example .env   # APP_ENV=local, APP_PORT=3010
make install           # imagem, npm install no container e sobe em http://localhost:$APP_PORT
```

| Comando | Efeito |
|---|---|
| `make up` / `make down` / `make restart` | Sobe / para / reinicia o container |
| `make logs` | Acompanha os logs |
| `make shell` | Shell dentro do container |

**Produção** (servidor com o Nginx Proxy Manager): `configs/docker/node/Dockerfile.deploy` compila o site dentro da imagem (`nuxt build`, multi-stage) e o serve com Node (`node .output/server/index.mjs`) na porta 3000 do container. O container não publica porta: entra na rede Docker do NPM, que cuida do domínio e do certificado.

1. No `.env`: `APP_ENV=production` e `PROXY_NETWORK` com o nome da rede do NPM (`docker network ls`; padrão `nginx-proxy-manager`).
2. `make install` (ou `make build && make up`).
3. No NPM, um Proxy Host: o domínio → scheme `http`, forward hostname `code-grimoire`, porta `3000`. Na aba SSL, peça o certificado Let's Encrypt e ligue *Force SSL*.

Conteúdo novo: `git pull && make update-build` compila o site de novo e troca o container.

## Onde fica cada coisa

```
content/
  laravel/index.md                         → o framework: nome, cor e descrição
  laravel/laravel-por-dentro/index.md      → a abertura de um tomo (um guia)
  laravel/laravel-por-dentro/01.ciclo-de-vida.md → um capítulo
  react/…
app/pages/[division]/index.vue             → a abertura de cada framework (tomos e sumário)
app/pages/[division]/[chapter].vue         → a página de um capítulo
app/assets/css/tailwind.css                → tokens do Tailwind v4 (cores, fontes); o visual fica nos componentes
shiki/sql-lines.ts                         → as linhas de SQL gerado nos blocos PHP
```

O número no começo do nome do capítulo (`01.`, `02.`…) define a ordem. Cada capítulo vira uma página, com o endereço `/<framework>/<nome-do-arquivo-sem-número>`, por exemplo `/laravel/recuperar-registros`. Nos capítulos, link para uma seção com `#<capitulo>-<id-do-titulo>` (ou `/<outro-framework>#<capitulo>-<id>`): o site resolve para a página do capítulo.

## Adicionar conhecimento

### Um novo framework

Crie `content/<framework>/index.md`. Ele aparece sozinho na capa (como uma lombada), na busca e na troca de framework do índice.

```md
---
title: "Vue"
description: "Uma frase sobre o que este framework guarda."
order: 1              # posição na capa e nas listas
spell: "plants"       # plants, acid, ice, smoke, embers, lightning ou rock
cover: "#1f4a33"      # cor da lombada na capa do grimório
color: "#1f6b45"      # cor do texto no tema claro
colorDark: "#6cc795"  # cor do texto no tema escuro
---
```

A cor pinta tudo daquele framework: título, números, links e marcador da folha. A magia (`spell`) dá o glifo do tomo e o fleurão que separa tomos e capítulos (`app/utils/spells.ts`).

### Um novo tomo (guia) dentro do framework

Crie `content/<framework>/<tomo>/index.md`. Os tomos aparecem em sequência na mesma página. O título segue o padrão "{tomo} por dentro" (React por dentro, Web por dentro…).

```md
---
title: "Filas por dentro"
description: "Resumo do tomo (usado na busca)."
version: "Laravel 12 e 13"
source: "De onde veio o material (aparece no fim do tomo)."
---

Parágrafo de abertura do tomo.
```

### Um novo capítulo

Crie `content/<framework>/<tomo>/NN.<slug>.md`:

```md
---
title: "Título completo do capítulo"
nav: "Nome curto no índice"
group: "Consultar"           # capítulos seguidos com o mesmo grupo ficam juntos no índice
description: "Uma frase para a busca."
---

O primeiro parágrafo abre o capítulo.

### Uma seção (ganha o número 3.1, 3.2… e um atalho no topo do capítulo)

#### Uma subseção
```

Links entre capítulos do mesmo framework: `[seção 21](#depuracao)` ou, para uma seção específica, `[o booted()](#criar-e-configurar-o-método-booted)` (capítulo + `-` + o id do título).

## Recursos dentro do Markdown

**SQL gerado (blocos PHP).** Dentro de um bloco ` ```php `, toda linha que começa com `--` é o SQL que a linha de cima produz. Ela ganha uma faixa própria e os bindings `?` ficam destacados. O "Mostrar SQL gerado" do índice esconde todas de uma vez, e o "Copiar" copia só o PHP.

````md
```php
User::where('ativo', 1)->get();
-- SQL: select * from "users" where "ativo" = ?
-- → order by "nome" asc
--      (uma observação em texto livre)
```
````

**Nome de arquivo no bloco de código:** ` ```ts [src/hooks/useWorker.ts] `.

**Notas:**

```md
::note{type="pitfall" title="Atenção"}
Texto da nota, com **Markdown**.
::
```

`type` pode ser `note`, `tip` ou `pitfall`.

**Versão mínima no meio do texto:** `:version[Laravel 12+]`

**Pergunta de revisão:**

```md
::question
#title
Qual a diferença entre render e commit?

#default
A resposta.
::
```

**Cadeia de chamadas** (abertura do tomo de Laravel):

```md
::chain
---
steps:
  - "User::where(...)"
  - "Model"
  - "SQL"
---
Legenda da cadeia.
::
```

**Fórmula:** `::formula{expr="UI = f(props, state, context)"}` seguido de `::` na linha de baixo.

**Bancadas ao vivo:** `::workbench{demo="who-renders" title="Quem renderiza?"}`, com a explicação dentro e `::` no fim. As bancadas existentes estão registradas em `app/components/content/Workbench.vue` (entre elas `who-renders`, `cart-reducer`, `main-thread-vs-worker`, `sse-simulator`, `route-rules`, `data-fetching`, `who-renders-vue`, `next-tick` e `cart-store`). Para criar outra, faça o componente em `app/components/demos/` e registre o nome em `app/components/content/Workbench.vue`. As de React usam React de verdade: o código fica em `app/react-workbenches/`. As de Vue rodam no próprio Vue do site; as que precisam de render functions ficam em `app/vue-workbenches/`.

**Diagrama das fases do React:** `::phases-diagram` seguido de `::`.

**Diagrama de fluxo** (caixas da esquerda para a direita, com faixas e notas):

```md
::flow-diagram
---
label: "Descrição para leitores de tela"
lanes:
  - { label: "servidor", from: 0, to: 2 }
steps:
  - { title: "Requisição", sub: "linha menor" }
  - { title: "Render", sub: "…", highlight: true, note: "nota embaixo da caixa" }
---
::
```

## Busca

Há duas buscas, e nenhuma precisa de cadastro: o índice (`/search.json`) é gerado no build a partir de todas as seções, inclusive o código.

- No índice lateral de cada framework, a busca procura só naquele framework e mostra o número da seção.
- `⌘K`, `Ctrl+K` ou `/` abrem a busca em todo o grimório, em qualquer página.

## O visual

A base é o layout das duas artifacts originais: índice fixo à esquerda, coluna de leitura, capítulos numerados, notas, código com o SQL em faixa própria, tabelas e bancadas. Por cima dela vem a camada de grimório, estática (sem efeitos de clique, para a leitura ficar leve; a única animação elaborada é a capa abrindo): a leitura numa folha de livro (lombada, papel com grão, páginas empilhadas) e fleurões entre capítulos. Quando o site é aberto direto em `/`, a página inicial começa com o livro fechado, a capa de couro com o título em ouro; ao clicar, a capa gira na lombada e surge a primeira folha, com a folha de rosto e o sumário, com cada framework apresentado como um tomo (Tomo I, Tomo II…), o seu glifo (`app/components/Glyph.vue`), a descrição e os grupos de capítulos. Cada framework tem uma magia: plantas (Vue), ácido (Nuxt), gelo (React), fumaça (Next), brasas (Laravel), raio (Web) e rocha (SQL); ela aparece só no desenho do glifo e do fleurão. Chegando ao início vindo de outra página, o livro já está aberto no sumário. Em telas estreitas, onde o índice lateral não cabe, o marcador (a fita no alto, `app/components/Bookmark.vue`) abre pela esquerda um painel com os capítulos do tomo e os outros tomos, e a busca fica no rodapé fixo, ao lado do Topo.
