/**
 * Analytics API service — wraps BI dashboard data calls.
 */

import api from './api'

const analyticsService = {
  getOverview: async () => {
    const { data } = await api.get('/analytics/overview/')
    return data
  },

  getTicketTrends: async (params = { days: 30, group_by: 'day' }) => {
    const { data } = await api.get('/analytics/ticket-trends/', { params })
    return data
  },

  getSentimentDistribution: async () => {
    const { data } = await api.get('/analytics/sentiment/')
    return data
  },

  getResolutionTimes: async () => {
    const { data } = await api.get('/analytics/resolution/')
    return data
  },

  getAgentPerformance: async () => {
    const { data } = await api.get('/analytics/agents/')
    return data
  },
}

export default analyticsService
