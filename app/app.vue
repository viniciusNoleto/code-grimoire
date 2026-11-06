<script setup lang="ts">
// toda página tem título; a capa usa só o nome do grimório
const SITE_NAME = 'Grimório de código'
// a capa fechada só aparece quando o site é aberto direto na página inicial;
// chegando de outra página (ou depois de abrir o livro), o início já é o sumário
useState<'closed' | 'opening' | 'open'>('book', () => (useRoute().path === '/' ? 'closed' : 'open'))
useHead({ titleTemplate: t => (!t || t === SITE_NAME ? SITE_NAME : `${t} · ${SITE_NAME}`) })
</script>

<template>
  <a
    href="#content"
    class="fixed top-2 left-4 z-100 -translate-y-[160%] rounded-md bg-tome px-3.5 py-2 text-background no-underline transition-transform focus:translate-y-0"
  >Pular para o conteúdo</a>
  <NuxtPage />
  <GlobalSearch />
</template>
