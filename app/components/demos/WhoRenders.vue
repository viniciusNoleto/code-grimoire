<template>
  <div>
    <DemosReactMount :load="() => import('~/react-workbenches/who-renders').then(m => m.WhoRenders)" />
    <div class="mt-3 flex flex-wrap gap-3.5 text-[.8rem] text-muted-foreground">
      <span><i class="mr-1.5 inline-block size-2.5 rounded-[2px] bg-warning align-[-1px]" />renderizou agora</span><span>O contador é um <code>useRef</code> incrementado no corpo do componente.</span>
    </div>
  </div>
</template>
