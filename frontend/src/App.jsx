/**
 * App.jsx — root component with role-based routing.
 *
 * Route protection:
 *   - PrivateRoute: requires authentication.
 *   - AdminRoute:   requires ADMIN role.
 *
 * Layout: pages inside the authenticated shell get the Navbar.
 */

import React from 'react'
import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import useAuthStore from './store/authStore'
import Navbar from './components/Navbar'

// Pages
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import TicketsPage from './pages/TicketsPage'
import TicketDetailPage from './pages/TicketDetailPage'
import NewTicketPage from './pages/NewTicketPage'
import AnalyticsPage from './pages/AnalyticsPage'

// ---------------------------------------------------------------------------
// Route guards
// ---------------------------------------------------------------------------

function PrivateRoute() {
  const { user } = useAuthStore()
  return user ? <Outlet /> : <Navigate to="/login" replace />
}

function AdminRoute() {
  const { user } = useAuthStore()
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'ADMIN') return <Navigate to="/" replace />
  return <Outlet />
}

// Authenticated layout — renders Navbar + page content
function AuthLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main>
        <Outlet />
      </main>
    </div>
  )
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------
export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected — authenticated users */}
      <Route element={<PrivateRoute />}>
        <Route element={<AuthLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/tickets" element={<TicketsPage />} />
          <Route path="/tickets/new" element={<NewTicketPage />} />
          <Route path="/tickets/:id" element={<TicketDetailPage />} />

          {/* Admin-only */}
          <Route element={<AdminRoute />}>
            <Route path="/analytics" element={<AnalyticsPage />} />
          </Route>
        </Route>
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
