<!-- Pergunta de revisão: a resposta abre ao clicar. -->
<template>
  <details class="group max-w-[68ch] border-b border-border py-3">
    <summary class="relative cursor-pointer list-none pl-[22px] font-semibold [&::-webkit-details-marker]:hidden">
      <span class="absolute left-0 font-mono text-tome" aria-hidden="true"><span class="group-open:hidden">+</span><span class="hidden group-open:inline">−</span></span>
      <slot name="title" mdc-unwrap="p" />
    </summary>
    <div class="pt-2 pl-[22px] [&_p]:text-[.93em] [&>p:last-child]:mb-0">
      <slot />
    </div>
  </details>
</template>
