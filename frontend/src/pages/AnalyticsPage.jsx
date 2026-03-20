/**
 * AnalyticsPage — Business Intelligence dashboard (Admin only).
 *
 * Charts powered by Recharts:
 *  - Ticket volume trend (line chart)
 *  - Sentiment distribution (pie chart)
 *  - Resolution time by category (bar chart)
 *  - Agent performance table
 */

import React, { useEffect, useState } from 'react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { Ticket, Clock, Users, TrendingUp, Smile } from 'lucide-react'
import analyticsService from '../services/analyticsService'
import KPICard from '../components/KPICard'
import LoadingSpinner from '../components/LoadingSpinner'

const SENTIMENT_COLORS = {
  POSITIVE: '#22c55e',
  NEUTRAL: '#94a3b8',
  NEGATIVE: '#ef4444',
}

const BAR_COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#f43f5e', '#6366f1']

export default function AnalyticsPage() {
  const [overview, setOverview] = useState(null)
  const [trends, setTrends] = useState(null)
  const [sentiment, setSentiment] = useState(null)
  const [resolution, setResolution] = useState(null)
  const [agents, setAgents] = useState(null)
  const [loading, setLoading] = useState(true)
  const [trendDays, setTrendDays] = useState(30)

  useEffect(() => {
    loadAll()
  }, [])

  useEffect(() => {
    analyticsService.getTicketTrends({ days: trendDays }).then(setTrends)
  }, [trendDays])

  const loadAll = async () => {
    setLoading(true)
    try {
      const [ov, tr, sen, res, ag] = await Promise.all([
        analyticsService.getOverview(),
        analyticsService.getTicketTrends({ days: trendDays }),
        analyticsService.getSentimentDistribution(),
        analyticsService.getResolutionTimes(),
        analyticsService.getAgentPerformance(),
      ])
      setOverview(ov)
      setTrends(tr)
      setSentiment(sen)
      setResolution(res)
      setAgents(ag)
    } catch (err) {
      console.error('Analytics load error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <LoadingSpinner className="py-32" />

  // Prepare sentiment pie data
  const sentimentPieData = (sentiment?.overall || []).map((item) => ({
    name: item.ai_sentiment || 'Unknown',
    value: item.count,
  }))

  // Prepare resolution bar data
  const resolutionBarData = (resolution?.by_category || []).map((item) => ({
    category: (item.ai_category || 'N/A').replace('_', ' '),
    avg_hours: item.avg_hours ?? 0,
    count: item.ticket_count,
  }))

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Business Intelligence Dashboard</h1>
        <button onClick={loadAll} className="btn-secondary text-sm">Refresh</button>
      </div>

      {/* KPI cards */}
      {overview && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KPICard
            title="Total Tickets"
            value={overview.total_tickets}
            icon={Ticket}
            color="blue"
          />
          <KPICard
            title="Open Tickets"
            value={overview.open_tickets}
            icon={TrendingUp}
            color="orange"
            subtitle="Awaiting resolution"
          />
          <KPICard
            title="Avg Resolution"
            value={overview.avg_resolution_hours !== null ? `${overview.avg_resolution_hours}h` : '—'}
            icon={Clock}
            color="green"
            subtitle="Resolved tickets"
          />
          <KPICard
            title="Active Agents"
            value={overview.active_agents}
            icon={Users}
            color="purple"
          />
          <KPICard
            title="New This Month"
            value={overview.new_this_month}
            icon={Ticket}
            color="blue"
          />
          <KPICard
            title="Resolved This Week"
            value={overview.resolved_this_week}
            icon={TrendingUp}
            color="green"
          />
          <KPICard
            title="Positive Sentiment"
            value={overview.positive_sentiment_pct !== null ? `${overview.positive_sentiment_pct}%` : '—'}
            icon={Smile}
            color="green"
            subtitle="Of AI-analysed tickets"
          />
        </div>
      )}

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Ticket volume trend */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">Ticket Volume</h2>
            <div className="flex gap-2">
              {[7, 30, 90].map((d) => (
                <button
                  key={d}
                  onClick={() => setTrendDays(d)}
                  className={`text-xs px-2 py-1 rounded ${
                    trendDays === d ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>
          {trends?.data?.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={trends.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Created"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="resolved"
                  name="Resolved"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-sm text-center py-8">No data for this period.</p>
          )}
        </div>

        {/* Sentiment distribution */}
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-4">Sentiment Distribution</h2>
          {sentimentPieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={sentimentPieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {sentimentPieData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={SENTIMENT_COLORS[entry.name] || '#94a3b8'}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-sm text-center py-8">
              No AI-processed tickets yet.
            </p>
          )}
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Resolution time by category */}
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-4">Avg. Resolution Time (hours) by Category</h2>
          {resolutionBarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={resolutionBarData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`${v}h`, 'Avg. Resolution']} />
                <Bar dataKey="avg_hours" name="Avg Hours">
                  {resolutionBarData.map((_, index) => (
                    <Cell key={index} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-sm text-center py-8">No resolved tickets yet.</p>
          )}
        </div>

        {/* Agent performance table */}
        <div className="card overflow-auto">
          <h2 className="font-semibold text-gray-800 mb-4">Agent Performance</h2>
          {agents?.agents?.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b">
                  <th className="pb-2">Agent</th>
                  <th className="pb-2 text-right">Open</th>
                  <th className="pb-2 text-right">Resolved</th>
                  <th className="pb-2 text-right">Avg. Time</th>
                </tr>
              </thead>
              <tbody>
                {agents.agents.map((agent) => (
                  <tr key={agent.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2 font-medium">{agent.username}</td>
                    <td className="py-2 text-right text-orange-600">{agent.open_count}</td>
                    <td className="py-2 text-right text-green-600">{agent.resolved_count}</td>
                    <td className="py-2 text-right text-gray-600">
                      {agent.avg_resolution_hours !== null
                        ? `${agent.avg_resolution_hours}h`
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-400 text-sm text-center py-8">No agent data yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}
