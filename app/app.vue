<script setup lang="ts">
// toda página tem título; a capa usa só o nome do grimório
const SITE_NAME = 'Grimório de código'
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
