/** Mostrar ou esconder, em todo o grimório, as linhas de SQL gerado. */
export function useSql() {
  const isVisible = useState('sql-visible', () => true)
  if (import.meta.client) {
    onMounted(() => { isVisible.value = !document.documentElement.classList.contains('sql-hidden') })
  }
  function toggle() {
    isVisible.value = !isVisible.value
    document.documentElement.classList.toggle('sql-hidden', !isVisible.value)
    try { localStorage.setItem('grimoire:sql', isVisible.value ? 'visible' : 'hidden') }
    catch {}
  }
  return { isVisible, toggle }
}
