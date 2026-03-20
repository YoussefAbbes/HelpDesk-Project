/**
 * Zustand ticket store — manages ticket list, filters, and pagination state.
 */

import { create } from 'zustand'
import ticketService from '../services/ticketService'
import toast from 'react-hot-toast'

const useTicketStore = create((set, get) => ({
  // -----------------------------------------------------------------------
  // State
  // -----------------------------------------------------------------------
  tickets: [],
  currentTicket: null,
  pagination: { count: 0, next: null, previous: null },
  filters: {
    status: '',
    priority: '',
    ai_category: '',
    ai_sentiment: '',
    search: '',
    ordering: '-created_at',
  },
  isLoading: false,
  error: null,

  // -----------------------------------------------------------------------
  // Actions
  // -----------------------------------------------------------------------

  fetchTickets: async (page = 1) => {
    set({ isLoading: true, error: null })
    try {
      const { filters } = get()
      const data = await ticketService.getTickets({ ...filters, page })
      set({
        tickets: data.results,
        pagination: { count: data.count, next: data.next, previous: data.previous },
        isLoading: false,
      })
    } catch (err) {
      set({ isLoading: false, error: err.message })
    }
  },

  fetchTicket: async (id) => {
    set({ isLoading: true, error: null })
    try {
      const ticket = await ticketService.getTicket(id)
      set({ currentTicket: ticket, isLoading: false })
      return ticket
    } catch (err) {
      set({ isLoading: false, error: err.message })
      return null
    }
  },

  createTicket: async (data) => {
    set({ isLoading: true, error: null })
    try {
      const ticket = await ticketService.createTicket(data)
      set((state) => ({
        tickets: [ticket, ...state.tickets],
        isLoading: false,
      }))
      toast.success('Ticket created! AI analysis is running in the background.')
      return ticket
    } catch (err) {
      const error = err.response?.data || err.message
      set({ isLoading: false, error })
      toast.error('Failed to create ticket.')
      return null
    }
  },

  updateTicket: async (id, data) => {
    set({ isLoading: true })
    try {
      const updated = await ticketService.updateTicket(id, data)
      set((state) => ({
        tickets: state.tickets.map((t) => (t.id === id ? updated : t)),
        currentTicket: state.currentTicket?.id === id ? updated : state.currentTicket,
        isLoading: false,
      }))
      toast.success('Ticket updated.')
      return updated
    } catch (err) {
      set({ isLoading: false })
      toast.error('Failed to update ticket.')
      return null
    }
  },

  deleteTicket: async (id) => {
    try {
      await ticketService.deleteTicket(id)
      set((state) => ({
        tickets: state.tickets.filter((t) => t.id !== id),
      }))
      toast.success('Ticket deleted.')
    } catch {
      toast.error('Failed to delete ticket.')
    }
  },

  setFilters: (filters) => set({ filters: { ...get().filters, ...filters } }),
  clearFilters: () =>
    set({
      filters: {
        status: '',
        priority: '',
        ai_category: '',
        ai_sentiment: '',
        search: '',
        ordering: '-created_at',
      },
    }),
}))

export default useTicketStore
