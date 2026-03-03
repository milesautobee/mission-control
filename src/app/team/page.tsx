'use client'

import { useEffect, useMemo, useState } from 'react'
import { ThemeToggle } from '@/components/ThemeToggle'
import { ViewToggle } from "@/components/ViewToggle"

type Agent = {
  id: string
  name: string
  role: string
  model: string
  device?: string | null
  description?: string | null
  isActive: boolean
  isSubagent: boolean
  currentTask?: string | null
  lastSeen?: string | null
}

const DEFAULT_MISSION_STATEMENT = 'Coordinate Miles and all sub-agents to keep Mission Control moving forward with speed and reliability.'

export default function TeamPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [missionStatement, setMissionStatement] = useState(DEFAULT_MISSION_STATEMENT)
  const [missionDraft, setMissionDraft] = useState(DEFAULT_MISSION_STATEMENT)
  const [editingMission, setEditingMission] = useState(false)
  const [loading, setLoading] = useState(true)
  const [savingMission, setSavingMission] = useState(false)

  useEffect(() => {
    const controller = new AbortController()

    async function fetchData() {
      try {
        const [agentsRes, missionRes] = await Promise.all([
          fetch('/api/agents', { signal: controller.signal }),
          fetch('/api/settings/mission_statement', { signal: controller.signal }),
        ])

        if (agentsRes.ok) {
          const agentsData = await agentsRes.json()
          setAgents(Array.isArray(agentsData) ? agentsData : [])
        }

        if (missionRes.ok) {
          const missionData = await missionRes.json()
          const value = typeof missionData?.value === 'string'
            ? missionData.value
            : DEFAULT_MISSION_STATEMENT
          setMissionStatement(value)
          setMissionDraft(value)
        } else if (missionRes.status === 404) {
          setMissionStatement(DEFAULT_MISSION_STATEMENT)
          setMissionDraft(DEFAULT_MISSION_STATEMENT)
        }
      } catch (error) {
        if ((error as { name?: string }).name !== 'AbortError') {
          console.error('Failed to fetch team page data:', error)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    return () => controller.abort()
  }, [])

  const mainAgent = useMemo(() => {
    return (
      agents.find(agent => agent.name.toLowerCase() === 'miles') ??
      agents.find(agent => !agent.isSubagent) ??
      agents[0] ??
      null
    )
  }, [agents])

  const subagents = useMemo(() => {
    return agents.filter(agent => agent.id !== mainAgent?.id && agent.isSubagent)
  }, [agents, mainAgent])

  async function saveMissionStatement() {
    const nextValue = missionDraft.trim() || DEFAULT_MISSION_STATEMENT
    setSavingMission(true)
    try {
      const res = await fetch('/api/settings/mission_statement', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: nextValue }),
      })

      if (!res.ok) {
        throw new Error('Failed to save mission statement')
      }

      const data = await res.json()
      const savedValue = typeof data?.value === 'string' ? data.value : nextValue
      setMissionStatement(savedValue)
      setMissionDraft(savedValue)
      setEditingMission(false)
    } catch (error) {
      console.error('Failed to save mission statement:', error)
    } finally {
      setSavingMission(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-full mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">M</span>
                </div>
                <h1 className="text-xl font-bold text-white">Mission Control</h1>
              </div>
              <span className="text-gray-500 text-sm hidden sm:block">
                Fast Track Operations Dashboard
              </span>
            </div>

            <div className="flex items-center gap-4">
              <ViewToggle active="team" />

              <ThemeToggle />

              <div className="hidden md:flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2 text-gray-400">
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                  <span>Team</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        <div className="rounded-2xl border border-pink-400/30 bg-gradient-to-r from-purple-600/20 via-fuchsia-500/20 to-pink-500/20 p-6">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-xl font-semibold text-white">Mission Statement</h2>
            {editingMission ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setMissionDraft(missionStatement)
                    setEditingMission(false)
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs border border-white/20 text-gray-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={saveMissionStatement}
                  disabled={savingMission}
                  className="px-3 py-1.5 rounded-lg text-xs bg-white text-gray-900 font-medium hover:bg-gray-100 disabled:opacity-60"
                >
                  {savingMission ? 'Saving...' : 'Save'}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditingMission(true)}
                className="px-3 py-1.5 rounded-lg text-xs border border-white/20 text-white hover:bg-white/10"
              >
                Edit
              </button>
            )}
          </div>

          {editingMission ? (
            <textarea
              value={missionDraft}
              onChange={(event) => setMissionDraft(event.target.value)}
              className="mt-4 w-full min-h-24 rounded-xl border border-white/20 bg-black/30 text-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400/40"
            />
          ) : (
            <p className="mt-4 text-gray-100 leading-relaxed">{missionStatement}</p>
          )}
        </div>

        <div className="rounded-2xl border border-emerald-400/25 bg-gradient-to-br from-emerald-500/15 to-green-500/5 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-emerald-300/90">Main Agent</p>
              <h3 className="text-3xl font-bold text-white mt-1">
                {mainAgent?.name ?? 'Miles'}
              </h3>
              <p className="text-gray-300 mt-2">{mainAgent?.role ?? 'Mission Operator'}</p>
            </div>
            <div className="flex items-center gap-2 text-emerald-300">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400"></span>
              </span>
              <span className="text-sm font-medium">Active</span>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg border border-white/10 bg-black/20 p-3">
              <p className="text-gray-400">Model</p>
              <p className="text-white mt-1">{mainAgent?.model ?? 'N/A'}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/20 p-3">
              <p className="text-gray-400">Device</p>
              <p className="text-white mt-1">{mainAgent?.device ?? 'N/A'}</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-white">Sub-agents</h3>
          <p className="text-sm text-gray-400 mt-1">
            {loading ? 'Loading team roster...' : `${subagents.length} sub-agents online`}
          </p>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {subagents.map(agent => (
              <article
                key={agent.id}
                className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-white font-semibold">{agent.name}</h4>
                    <p className="text-sm text-gray-300 mt-1">{agent.role}</p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border ${
                      agent.isActive
                        ? 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10'
                        : 'text-gray-300 border-white/20 bg-white/5'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        agent.isActive ? 'bg-emerald-400' : 'bg-gray-500'
                      }`}
                    />
                    {agent.isActive ? 'Active' : 'Idle'}
                  </span>
                </div>
                <div className="mt-4 space-y-2 text-sm">
                  <p className="text-gray-400">
                    <span className="text-gray-500">Model:</span>{' '}
                    <span className="text-gray-200">{agent.model}</span>
                  </p>
                  <p className="text-gray-400">
                    <span className="text-gray-500">Device:</span>{' '}
                    <span className="text-gray-200">{agent.device ?? 'N/A'}</span>
                  </p>
                </div>
              </article>
            ))}

            {!loading && subagents.length === 0 && (
              <div className="rounded-xl border border-white/10 bg-white/5 p-5 text-sm text-gray-400">
                No sub-agents available yet.
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
