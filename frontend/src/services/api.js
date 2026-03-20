/**
 * Axios instance pre-configured for the HelpDesk API.
 *
 * - Automatically attaches the JWT Bearer token from the auth store.
 * - Handles 401 responses by attempting a token refresh.
 * - Redirects to /login on unrecoverable auth failure.
 */

import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1'

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ---------------------------------------------------------------------------
// Request interceptor — inject Authorization header
// ---------------------------------------------------------------------------
api.interceptors.request.use(
  (config) => {
    // Read token directly from localStorage to avoid circular dependency with zustand
    try {
      const raw = localStorage.getItem('helpdesk-auth')
      if (raw) {
        const stored = JSON.parse(raw)
        const token = stored?.state?.accessToken
        if (token) {
          config.headers['Authorization'] = `Bearer ${token}`
        }
      }
    } catch {
      // Ignore parse errors
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ---------------------------------------------------------------------------
// Response interceptor — handle 401 / token refresh
// ---------------------------------------------------------------------------
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        const raw = localStorage.getItem('helpdesk-auth')
        const stored = raw ? JSON.parse(raw) : null
        const refreshToken = stored?.state?.refreshToken

        if (!refreshToken) throw new Error('No refresh token')

        const { data } = await axios.post(`${BASE_URL}/auth/token/refresh/`, {
          refresh: refreshToken,
        })

        // Persist the new access token
        const updated = { ...stored, state: { ...stored.state, accessToken: data.access } }
        localStorage.setItem('helpdesk-auth', JSON.stringify(updated))
        api.defaults.headers.common['Authorization'] = `Bearer ${data.access}`
        originalRequest.headers['Authorization'] = `Bearer ${data.access}`
        return api(originalRequest)
      } catch {
        // Refresh failed — clear auth and redirect
        localStorage.removeItem('helpdesk-auth')
        window.location.href = '/login'
        return Promise.reject(error)
      }
    }

    return Promise.reject(error)
  }
)

export default api
