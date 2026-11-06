<script setup lang="ts">
// Endereços antigos (/laravel/tomo/capitulo) levam à seção na página contínua.
const route = useRoute()
useSeoMeta({ title: 'Redirecionando…' })
const rest = ([] as string[]).concat(route.params.rest as string[]).filter(Boolean)
await navigateTo(`/${String(route.params.division)}${rest.length ? '#' + rest.at(-1) : ''}`, { replace: true, redirectCode: 301 })
</script>

<template>
  <div />
</template>
