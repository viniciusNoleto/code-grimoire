<!-- Linhas de grupo nas tabelas de referência (| **Grupo** | | |): a segunda célula vazia vira um subtítulo. -->
<template>
  <tr class="last:[&>td]:border-b-0 has-[>td:nth-child(2):empty]:[&>td]:pt-4 has-[>td:nth-child(2):empty]:[&>td]:text-[.7rem] has-[>td:nth-child(2):empty]:[&>td]:tracking-[.12em] has-[>td:nth-child(2):empty]:[&>td]:text-tome has-[>td:nth-child(2):empty]:[&>td]:uppercase">
    <slot />
  </tr>
</template>
