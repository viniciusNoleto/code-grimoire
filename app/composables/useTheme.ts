/** Tema claro/escuro (@nuxtjs/color-mode). Sem escolha salva, segue o sistema. */
export function useTheme() {
  const mode = useColorMode()
  function toggle() {
    mode.preference = mode.value === 'dark' ? 'light' : 'dark'
  }
  return { mode, toggle }
}
