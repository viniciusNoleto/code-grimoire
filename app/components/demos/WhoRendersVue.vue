<script setup lang="ts">
import { WhoRendersVue } from '~/vue-workbenches/who-renders'
</script>

<template>
  <div>
    <WhoRendersVue />
    <div class="mt-3 flex flex-wrap gap-3.5 text-[.8rem] text-muted-foreground">
      <span><i class="mr-1.5 inline-block size-2.5 rounded-[2px] bg-warning align-[-1px]" />renderizou agora</span><span>O contador é uma variável comum incrementada dentro da render function.</span>
    </div>
  </div>
</template>
