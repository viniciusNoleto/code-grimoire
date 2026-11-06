<!-- Assinatura de um método: uma linha só, rolando na horizontal se precisar. -->
<template>
  <p class="max-w-full overflow-x-auto rounded-md border border-border bg-code px-3 py-2 font-mono text-[.82rem] whitespace-nowrap text-code-foreground [&_code]:bg-transparent [&_code]:p-0 [&_code]:text-[length:inherit] [&_code]:whitespace-pre [&_code]:wrap-normal">
    <slot mdc-unwrap="p" />
  </p>
</template>
