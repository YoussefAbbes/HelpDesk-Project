import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import './index.css'
import useThemeStore from './store/themeStore'

// Initialize theme before rendering
useThemeStore.getState().initialize()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'dark:bg-dark-card dark:text-gray-100',
          style: {
            background: 'var(--color-bg-primary)',
            color: 'var(--color-text-primary)',
          },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>,
)
