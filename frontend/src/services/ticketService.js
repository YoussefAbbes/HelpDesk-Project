/**
 * Ticket API service — wraps all ticket-related HTTP calls.
 */

import api from './api'

const ticketService = {
  /**
   * Fetch paginated, filtered list of tickets.
   * @param {object} params — filter/search/pagination parameters
   */
  getTickets: async (params = {}) => {
    // Remove empty string params to keep URLs clean
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
    )
    const { data } = await api.get('/tickets/', { params: cleanParams })
    return data
  },

  /**
   * Fetch a single ticket with all messages.
   * @param {number} id
   */
  getTicket: async (id) => {
    const { data } = await api.get(`/tickets/${id}/`)
    return data
  },

  /**
   * Create a new ticket (triggers async AI analysis automatically).
   * @param {object} payload — { title, description, priority, tag_ids }
   */
  createTicket: async (payload) => {
    const { data } = await api.post('/tickets/', payload)
    return data
  },

  /**
   * Partially update a ticket (status, priority, assigned_to, etc.).
   * @param {number} id
   * @param {object} payload
   */
  updateTicket: async (id, payload) => {
    const { data } = await api.patch(`/tickets/${id}/`, payload)
    return data
  },

  /**
   * Delete a ticket.
   * @param {number} id
   */
  deleteTicket: async (id) => {
    await api.delete(`/tickets/${id}/`)
  },

  /**
   * Assign a ticket to an agent.
   * @param {number} ticketId
   * @param {number} agentId
   */
  assignTicket: async (ticketId, agentId) => {
    const { data } = await api.post(`/tickets/${ticketId}/assign/`, { agent_id: agentId })
    return data
  },

  /**
   * Re-run the AI analysis pipeline on an existing ticket.
   * @param {number} id
   */
  reprocessAI: async (id) => {
    const { data } = await api.post(`/tickets/${id}/reprocess_ai/`)
    return data
  },

  // -----------------------------------------------------------------------
  // Messages
  // -----------------------------------------------------------------------

  getMessages: async (ticketId) => {
    const { data } = await api.get(`/tickets/${ticketId}/messages/`)
    return data
  },

  addMessage: async (ticketId, payload) => {
    const { data } = await api.post(`/tickets/${ticketId}/messages/`, payload)
    return data
  },

  deleteMessage: async (ticketId, messageId) => {
    await api.delete(`/tickets/${ticketId}/messages/${messageId}/`)
  },
}

export default ticketService
