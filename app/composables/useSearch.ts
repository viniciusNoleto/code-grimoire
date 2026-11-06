/** Estado da busca global (abre com ⌘K, Ctrl+K ou /). */
export function useSearch() {
  const isOpen = useState('search-open', () => false)
  return {
    isOpen,
    open: () => { isOpen.value = true },
    close: () => { isOpen.value = false },
  }
}
