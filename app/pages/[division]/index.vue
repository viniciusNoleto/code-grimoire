<script setup lang="ts">
// A abertura de um framework: a apresentação de cada tomo e o sumário dos
// capítulos. Cada capítulo tem página própria (/laravel/rotas), para que o
// celular não precise montar o framework inteiro de uma vez.
const route = useRoute()
const slug = String(route.params.division)
const { data: tree } = await useTree()
const division = computed(() => tree.value.find(d => d.path === `/${slug}`))
if (!division.value) {
  throw createError({ statusCode: 404, statusMessage: 'Este framework não está no grimório', fatal: true })
}

// só a abertura de cada tomo traz corpo; os capítulos vêm da árvore (metadados)
const tomePaths = division.value.tomes.map(t => t.path)
const { data: tomeDocs } = await useAsyncData(`tomes:${slug}`, () =>
  $fetch<any[]>('/api/grimoire/docs', { query: { path: tomePaths } }),
)
const tomes = computed(() => division.value!.tomes.map(t => ({
  id: slugOf(t.path),
  tree: t,
  doc: tomeDocs.value?.find(d => d.path === t.path),
})))

const pad = (n: number) => String(n).padStart(2, '0')
const position = computed(() => tree.value.findIndex(d => d.path === division.value!.path) + 1)

useSeoMeta({ title: division.value.title, description: division.value.description })

// endereços antigos da página contínua (/laravel#rotas-grupos) levam ao capítulo
onMounted(() => {
  if (!route.hash) return
  const to = resolveContentLink(route.hash, slug, tree.value)
  if (to !== route.hash) navigateTo(to, { replace: true })
})
</script>

<template>
  <DivisionShell :division="division!">
    <template v-for="(t, ti) in tomes" :key="t.id">
      <!-- a abertura do tomo, como a de um capítulo de livro -->
      <header :id="t.id" class="pt-12 pb-5 max-book:pt-6">
        <div class="flex items-center gap-4">
          <Glyph :spell="division!.spell" class="size-[clamp(40px,5vw,56px)] shrink-0 text-tome" />
          <p class="m-0 font-book text-[clamp(1.05rem,2vw,1.25rem)] leading-snug text-tome italic">
            Tomo {{ toRoman(position) }}<template v-if="t.tree.version">
              · {{ t.tree.version }}
            </template>
          </p>
        </div>
        <component
          :is="ti === 0 ? 'h1' : 'h2'"
          class="mt-3 mb-3 font-book text-[clamp(2.1rem,5.4vw,3.5rem)] leading-[1] font-normal tracking-[-.015em] text-balance text-foreground"
        >
          {{ t.tree.title }}
        </component>
        <ContentRenderer v-if="t.doc" :value="t.doc" class="m-0 max-w-[62ch] text-[1.02rem] text-foreground" />
        <!-- fleurão na magia do tomo: separa a abertura do sumário -->
        <div class="mt-9 flex items-center gap-3.5" aria-hidden="true">
          <span class="h-px flex-1 bg-border" />
          <span class="ornament block h-4 w-16" />
          <span class="h-px flex-1 bg-border" />
        </div>
      </header>

      <!-- sumário: os capítulos agrupados, cada um levando à sua página -->
      <nav :aria-label="`Capítulos de ${t.tree.title}`">
        <template v-for="g in groupChapters(t.tree.chapters.map((c, i) => ({ ...c, number: pad(i + 1) })))" :key="g.name">
          <h2 class="mt-7 mb-1.5 font-book text-[1.2rem] font-normal text-foreground italic">
            {{ g.name }}
          </h2>
          <ol class="m-0 grid list-none gap-px p-0">
            <li v-for="c in g.chapters" :key="c.path">
              <NuxtLink
                :to="`/${slug}/${slugOf(c.path)}`"
                class="grid grid-cols-[30px_minmax(0,1fr)] gap-x-1 rounded-md px-2 py-1.5 text-foreground no-underline hover:bg-tome-soft"
              >
                <span class="pt-px text-[.82rem] text-tome tabular-nums">{{ c.number }}</span>
                <span class="text-[.95rem] leading-snug font-medium">{{ c.title }}</span>
                <span v-if="c.description" class="col-start-2 line-clamp-1 text-[.82rem] text-muted-foreground">{{ c.description }}</span>
              </NuxtLink>
            </li>
          </ol>
        </template>
      </nav>

      <footer v-if="t.doc?.source" class="mt-14 border-t border-border pt-[18px] text-[.85rem] text-muted-foreground">
        {{ t.doc.source }}
      </footer>
    </template>
    <ResumeReading :division="division!" />
  </DivisionShell>
</template>
