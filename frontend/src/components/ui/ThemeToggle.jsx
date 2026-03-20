/**
 * ThemeToggle - Dark mode toggle component
 *
 * Features:
 * - Sun/Moon icon toggle
 * - Smooth icon transition animation
 * - Persists preference to localStorage
 * - Respects system preference
 */

import React from 'react'
import { Sun, Moon, Monitor } from 'lucide-react'
import useThemeStore from '../../store/themeStore'

export default function ThemeToggle({ showLabel = false, className = '' }) {
  const { theme, toggleTheme } = useThemeStore()

  // Determine which icon to show based on resolved theme
  const isDark = theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  return (
    <button
      onClick={toggleTheme}
      className={`
        relative p-2.5 rounded-xl
        text-gray-500 hover:text-gray-700
        dark:text-gray-400 dark:hover:text-gray-200
        hover:bg-gray-100 dark:hover:bg-dark-hover
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
        dark:focus:ring-offset-dark-bg
        ${className}
      `}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <div className="relative w-5 h-5">
        {/* Sun icon */}
        <Sun
          className={`
            absolute inset-0 w-5 h-5
            transition-all duration-300 ease-out
            ${isDark ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'}
          `}
        />
        {/* Moon icon */}
        <Moon
          className={`
            absolute inset-0 w-5 h-5
            transition-all duration-300 ease-out
            ${isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'}
          `}
        />
      </div>
      {showLabel && (
        <span className="ml-2 text-sm font-medium">
          {isDark ? 'Dark' : 'Light'}
        </span>
      )}
    </button>
  )
}

// Theme selector with all three options
export function ThemeSelector({ className = '' }) {
  const { theme, setTheme } = useThemeStore()

  const options = [
    { value: 'light', icon: Sun, label: 'Light' },
    { value: 'dark', icon: Moon, label: 'Dark' },
    { value: 'system', icon: Monitor, label: 'System' },
  ]

  return (
    <div
      className={`
        inline-flex rounded-xl bg-gray-100 dark:bg-dark-card p-1
        ${className}
      `}
    >
      {options.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
            transition-all duration-200
            ${
              theme === value
                ? 'bg-white dark:bg-dark-hover text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }
          `}
        >
          <Icon className="w-4 h-4" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  )
}

// Dropdown variant for compact spaces
export function ThemeDropdown({ className = '' }) {
  const { theme, setTheme } = useThemeStore()
  const [isOpen, setIsOpen] = React.useState(false)

  const options = [
    { value: 'light', icon: Sun, label: 'Light' },
    { value: 'dark', icon: Moon, label: 'Dark' },
    { value: 'system', icon: Monitor, label: 'System' },
  ]

  const currentOption = options.find((o) => o.value === theme) || options[2]
  const CurrentIcon = currentOption.icon

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="
          flex items-center gap-2 px-3 py-2 rounded-xl
          text-gray-600 dark:text-gray-300
          hover:bg-gray-100 dark:hover:bg-dark-hover
          transition-colors
        "
      >
        <CurrentIcon className="w-4 h-4" />
        <span className="text-sm">{currentOption.label}</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-36 rounded-xl bg-white dark:bg-dark-card shadow-large border border-gray-200 dark:border-dark-border py-1 z-50 animate-scale-in origin-top-right">
            {options.map(({ value, icon: Icon, label }) => (
              <button
                key={value}
                onClick={() => {
                  setTheme(value)
                  setIsOpen(false)
                }}
                className={`
                  w-full flex items-center gap-3 px-4 py-2.5 text-sm
                  transition-colors
                  ${
                    theme === value
                      ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30'
                      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-dark-hover'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
