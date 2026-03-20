/**
 * SettingsPage — user preferences for theme and email notifications.
 */

import React, { useState } from 'react'
import { Moon, Sun, Monitor, Bell, BellOff, Save } from 'lucide-react'
import useAuthStore from '../store/authStore'
import useThemeStore from '../store/themeStore'
import api from '../services/api'
import Button from '../components/ui/Button'

export default function SettingsPage() {
  const { user, setUser } = useAuthStore()
  const { theme, setTheme } = useThemeStore()
  const [isSaving, setIsSaving] = useState(false)

  // Local state for settings
  const [emailNotifications, setEmailNotifications] = useState(
    user?.email_notifications ?? true
  )
  const [selectedTheme, setSelectedTheme] = useState(
    user?.theme_preference?.toLowerCase() || theme
  )

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const { data } = await api.patch('/users/me/', {
        theme_preference: selectedTheme.toUpperCase(),
        email_notifications: emailNotifications,
      })

      setUser(data)
      setTheme(selectedTheme)
      alert('Settings saved successfully!')
    } catch (error) {
      console.error('Failed to save settings:', error)
      alert('Failed to save settings. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const themeOptions = [
    {
      value: 'light',
      label: 'Light',
      description: 'Bright and clear interface',
      icon: Sun,
    },
    {
      value: 'dark',
      label: 'Dark',
      description: 'Easy on the eyes in low light',
      icon: Moon,
    },
    {
      value: 'system',
      label: 'System',
      description: 'Follow your device settings',
      icon: Monitor,
    },
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Settings
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Customize your HelpDesk AI experience
        </p>
      </div>

      {/* Theme preference */}
      <div className="card mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Appearance
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Choose how HelpDesk AI looks to you
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {themeOptions.map((option) => {
            const Icon = option.icon
            const isSelected = selectedTheme === option.value

            return (
              <button
                key={option.value}
                onClick={() => setSelectedTheme(option.value)}
                className={`p-4 rounded-xl border-2 transition-all ${
                  isSelected
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-dark-border hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="flex flex-col items-center text-center gap-3">
                  <div
                    className={`p-3 rounded-full ${
                      isSelected
                        ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400'
                        : 'bg-gray-100 dark:bg-dark-hover text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3
                      className={`font-semibold ${
                        isSelected
                          ? 'text-primary-600 dark:text-primary-400'
                          : 'text-gray-900 dark:text-gray-100'
                      }`}
                    >
                      {option.label}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {option.description}
                    </p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Email notifications */}
      <div className="card mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Notifications
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Manage how you receive updates
        </p>

        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-hover rounded-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white dark:bg-dark-card rounded-lg">
              {emailNotifications ? (
                <Bell className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              ) : (
                <BellOff className="w-5 h-5 text-gray-400" />
              )}
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100">
                Email Notifications
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Receive email alerts for ticket updates
              </p>
            </div>
          </div>

          <button
            onClick={() => setEmailNotifications(!emailNotifications)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              emailNotifications
                ? 'bg-primary-600'
                : 'bg-gray-300 dark:bg-gray-600'
            }`}
            role="switch"
            aria-checked={emailNotifications}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                emailNotifications ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <Button
          variant="primary"
          onClick={handleSave}
          loading={isSaving}
          className="px-6"
        >
          <Save className="w-4 h-4 mr-2" />
          Save Settings
        </Button>
      </div>
    </div>
  )
}
