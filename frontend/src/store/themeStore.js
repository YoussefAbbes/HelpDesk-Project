/**
 * Theme Store - Dark mode state management with localStorage persistence
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Apply theme to document
function applyTheme(theme) {
  const root = document.documentElement
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches

  if (theme === 'dark' || (theme === 'system' && systemDark)) {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}

// Initialize theme on load
function initializeTheme(theme) {
  applyTheme(theme)

  // Listen for system preference changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    const currentTheme = useThemeStore.getState().theme
    if (currentTheme === 'system') {
      applyTheme('system')
    }
  })
}

const useThemeStore = create(
  persist(
    (set, get) => ({
      theme: 'system', // 'light' | 'dark' | 'system'

      setTheme: (theme) => {
        set({ theme })
        applyTheme(theme)
      },

      toggleTheme: () => {
        const current = get().theme
        const next = current === 'light' ? 'dark' : current === 'dark' ? 'system' : 'light'
        set({ theme: next })
        applyTheme(next)
      },

      // Quick toggle between light and dark (skips system)
      toggleDarkMode: () => {
        const root = document.documentElement
        const isDark = root.classList.contains('dark')
        set({ theme: isDark ? 'light' : 'dark' })
        applyTheme(isDark ? 'light' : 'dark')
      },

      // Initialize on app start
      initialize: () => {
        const theme = get().theme
        initializeTheme(theme)
      },

      // Check if dark mode is active
      isDark: () => {
        const theme = get().theme
        if (theme === 'dark') return true
        if (theme === 'light') return false
        return window.matchMedia('(prefers-color-scheme: dark)').matches
      },
    }),
    {
      name: 'helpdesk-theme',
      onRehydrateStorage: () => (state) => {
        // Apply theme after rehydration from localStorage
        if (state) {
          applyTheme(state.theme)
        }
      },
    }
  )
)

export default useThemeStore
