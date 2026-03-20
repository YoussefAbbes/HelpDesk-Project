/**
 * Zustand auth store — manages JWT tokens and authenticated user state.
 *
 * Tokens are persisted in localStorage so they survive page refreshes.
 * The `useAuthStore` hook is used throughout the app to read auth state
 * and dispatch login/logout actions.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../services/api'

const useAuthStore = create(
  persist(
    (set, get) => ({
      // -----------------------------------------------------------------------
      // State
      // -----------------------------------------------------------------------
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
      error: null,

      // -----------------------------------------------------------------------
      // Actions
      // -----------------------------------------------------------------------

      /**
       * Login with username & password — fetches JWT tokens and user profile.
       */
      login: async (username, password) => {
        set({ isLoading: true, error: null })
        try {
          const { data: tokens } = await api.post('/auth/token/', { username, password })
          // Persist tokens
          set({ accessToken: tokens.access, refreshToken: tokens.refresh })
          // Fetch user profile
          api.defaults.headers.common['Authorization'] = `Bearer ${tokens.access}`
          const { data: user } = await api.get('/users/me/')
          set({ user, isLoading: false })
          return { success: true }
        } catch (err) {
          const error = err.response?.data?.detail || 'Login failed. Please check your credentials.'
          set({ isLoading: false, error })
          return { success: false, error }
        }
      },

      /**
       * Register a new account, then auto-login.
       */
      register: async (payload) => {
        set({ isLoading: true, error: null })
        try {
          await api.post('/users/register/', payload)
          // Auto-login after successful registration
          return await get().login(payload.username, payload.password)
        } catch (err) {
          const error =
            err.response?.data?.username?.[0] ||
            err.response?.data?.email?.[0] ||
            err.response?.data?.password?.[0] ||
            'Registration failed.'
          set({ isLoading: false, error })
          return { success: false, error }
        }
      },

      /**
       * Clear auth state — effectively logs out.
       */
      logout: () => {
        delete api.defaults.headers.common['Authorization']
        set({ user: null, accessToken: null, refreshToken: null, error: null })
      },

      /**
       * Update the stored user profile (after a PATCH /users/me/ call).
       */
      setUser: (user) => set({ user }),

      clearError: () => set({ error: null }),
    }),
    {
      name: 'helpdesk-auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
    }
  )
)

export default useAuthStore
