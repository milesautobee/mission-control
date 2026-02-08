'use client'

import { useState, useEffect, useCallback } from 'react'

interface SessionInfo {
  key: string
  kind: string
  channel: string
  label: string | null
}

interface AgentStatusData {
  active: boolean
  sessionCount: number
  sessions: SessionInfo[]
  checkedAt: string
}

export function AgentStatus({ variant = 'badge' }: { variant?: 'badge' | 'hud' }) {
  const [status, setStatus] = useState<AgentStatusData | null>(null)

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/agent-status')
      const data = await res.json()
      setStatus(data)
    } catch {
      setStatus(null)
    }
  }, [])

  useEffect(() => {
    fetchStatus()
    // Poll every 15 seconds
    const interval = setInterval(fetchStatus, 15000)
    return () => clearInterval(interval)
  }, [fetchStatus])

  if (!status) return null

  if (variant === 'hud') {
    return (
      <div className="space-y-1 font-mono text-xs">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${status.active ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`} />
          <span className={status.active ? 'text-green-400' : 'text-gray-500'}>
            MILES {status.active ? 'ACTIVE' : 'IDLE'}
          </span>
        </div>
        {status.active && status.sessions.length > 0 && (
          <div className="pl-4 space-y-0.5">
            {status.sessions.slice(0, 3).map((s, i) => (
              <div key={i} className="text-gray-500">
                <span className="text-pink-400">▸</span> {s.channel}
                {s.label && <span className="text-gray-600"> ({s.label})</span>}
              </div>
            ))}
            {status.sessions.length > 3 && (
              <div className="text-gray-600">+{status.sessions.length - 3} more</div>
            )}
          </div>
        )}
      </div>
    )
  }

  // Badge variant (for islands view)
  return (
    <div className={`
      flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs
      ${status.active 
        ? 'bg-green-500/15 border border-green-500/30 text-green-400' 
        : 'bg-white/5 border border-white/10 text-gray-500'}
    `}>
      <span className={`w-2 h-2 rounded-full ${status.active ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`} />
      <span>Miles: {status.active ? 'Working' : 'Idle'}</span>
      {status.active && status.sessionCount > 0 && (
        <span className="text-green-500/70">({status.sessionCount} session{status.sessionCount > 1 ? 's' : ''})</span>
      )}
    </div>
  )
}

// Floating Miles avatar for map/space views
export function MilesAvatar({ active, sessions }: { active: boolean; sessions: SessionInfo[] }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div 
      className="relative cursor-pointer"
      onClick={() => setExpanded(!expanded)}
    >
      {/* Avatar with pulse */}
      <div className={`
        w-10 h-10 rounded-full flex items-center justify-center text-lg
        border-2 transition-all
        ${active 
          ? 'bg-green-500/20 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]' 
          : 'bg-gray-800 border-gray-600'}
      `}>
        🤖
      </div>
      {active && (
        <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border border-black animate-pulse" />
      )}

      {/* Tooltip */}
      {expanded && (
        <div className="absolute top-12 right-0 w-48 bg-black/80 backdrop-blur-xl rounded-lg border border-white/10 p-3 z-50 text-xs">
          <div className="font-semibold text-white mb-1">
            🤖 Miles — {active ? 'Working' : 'Idle'}
          </div>
          {active && sessions.length > 0 ? (
            <div className="space-y-1 mt-2">
              {sessions.map((s, i) => (
                <div key={i} className="flex items-center gap-1.5 text-gray-400">
                  <span className="text-pink-400">▸</span>
                  <span>{s.channel}</span>
                  {s.kind === 'isolated' && <span className="text-gray-600">(sub-agent)</span>}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 mt-1">No active sessions</div>
          )}
        </div>
      )}
    </div>
  )
}
