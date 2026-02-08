'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Board } from '@/types'
import { ThemeToggle } from '@/components/ThemeToggle'
import { ViewToggle } from '@/components/ViewToggle'
import Link from 'next/link'

interface ProjectWithMeta {
  id: string
  title: string
  priority: string
  columnName: string
  columnId: string
  assignee: string | null
  tasks: { id: string; completed: boolean; title?: string }[]
  description: string | null
}

/* ─── Detailed SVG Island ─── */
function Island({ project, x, y, size, onClick, isSelected, isBoatTarget }: {
  project: ProjectWithMeta
  x: number; y: number; size: number
  onClick: (p: ProjectWithMeta) => void
  isSelected: boolean
  isBoatTarget?: boolean
}) {
  void isBoatTarget
  const completedTasks = project.tasks?.filter(t => t.completed).length || 0
  const totalTasks = project.tasks?.length || 0
  const progress = totalTasks > 0 ? completedTasks / totalTasks : 0
  const isActive = project.columnName === 'In Progress'
  const isDone = project.columnName === 'Done'
  const isBacklog = project.columnName === 'Backlog'

  const s = size // shorthand
  const hash = project.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)

  // Island shape variation — use irregular polygon instead of ellipse
  const shapeVar = hash % 4
  const islandPath = shapeVar === 0
    ? `M${x - s*0.38},${y + s*0.05} Q${x - s*0.35},${y - s*0.28} ${x - s*0.05},${y - s*0.3} Q${x + s*0.2},${y - s*0.32} ${x + s*0.38},${y - s*0.08} Q${x + s*0.4},${y + s*0.15} ${x + s*0.2},${y + s*0.25} Q${x},${y + s*0.3} ${x - s*0.25},${y + s*0.22} Z`
    : shapeVar === 1
    ? `M${x - s*0.35},${y} Q${x - s*0.38},${y - s*0.25} ${x},${y - s*0.32} Q${x + s*0.35},${y - s*0.25} ${x + s*0.4},${y + s*0.05} Q${x + s*0.3},${y + s*0.28} ${x - s*0.1},${y + s*0.28} Q${x - s*0.35},${y + s*0.2} ${x - s*0.35},${y} Z`
    : shapeVar === 2
    ? `M${x - s*0.3},${y + s*0.1} Q${x - s*0.4},${y - s*0.15} ${x - s*0.15},${y - s*0.3} Q${x + s*0.1},${y - s*0.35} ${x + s*0.35},${y - s*0.15} Q${x + s*0.42},${y + s*0.1} ${x + s*0.15},${y + s*0.27} Q${x - s*0.05},${y + s*0.32} ${x - s*0.3},${y + s*0.1} Z`
    : `M${x - s*0.32},${y - s*0.05} Q${x - s*0.3},${y - s*0.3} ${x + s*0.05},${y - s*0.28} Q${x + s*0.3},${y - s*0.3} ${x + s*0.37},${y} Q${x + s*0.35},${y + s*0.22} ${x + s*0.05},${y + s*0.3} Q${x - s*0.2},${y + s*0.25} ${x - s*0.32},${y - s*0.05} Z`

  // Beach path (slightly larger)
  const beachPath = shapeVar === 0
    ? `M${x - s*0.42},${y + s*0.08} Q${x - s*0.39},${y - s*0.32} ${x - s*0.05},${y - s*0.34} Q${x + s*0.22},${y - s*0.36} ${x + s*0.42},${y - s*0.1} Q${x + s*0.44},${y + s*0.18} ${x + s*0.22},${y + s*0.29} Q${x},${y + s*0.34} ${x - s*0.28},${y + s*0.26} Z`
    : shapeVar === 1
    ? `M${x - s*0.39},${y + s*0.03} Q${x - s*0.42},${y - s*0.29} ${x},${y - s*0.36} Q${x + s*0.39},${y - s*0.29} ${x + s*0.44},${y + s*0.08} Q${x + s*0.34},${y + s*0.32} ${x - s*0.12},${y + s*0.32} Q${x - s*0.39},${y + s*0.24} ${x - s*0.39},${y + s*0.03} Z`
    : shapeVar === 2
    ? `M${x - s*0.34},${y + s*0.13} Q${x - s*0.44},${y - s*0.18} ${x - s*0.18},${y - s*0.34} Q${x + s*0.12},${y - s*0.39} ${x + s*0.39},${y - s*0.18} Q${x + s*0.46},${y + s*0.13} ${x + s*0.18},${y + s*0.31} Q${x - s*0.07},${y + s*0.36} ${x - s*0.34},${y + s*0.13} Z`
    : `M${x - s*0.36},${y - s*0.08} Q${x - s*0.34},${y - s*0.34} ${x + s*0.07},${y - s*0.32} Q${x + s*0.34},${y - s*0.34} ${x + s*0.41},${y + s*0.03} Q${x + s*0.39},${y + s*0.26} ${x + s*0.07},${y + s*0.34} Q${x - s*0.23},${y + s*0.29} ${x - s*0.36},${y - s*0.08} Z`

  // Vegetation color
  const vegColor = progress > 0.7 ? '#1a8a4a' : progress > 0.3 ? '#2eab6f' : '#5bbf8a'
  const vegDarkColor = progress > 0.7 ? '#14693a' : progress > 0.3 ? '#1f8a55' : '#3da370'

  // Status color for glow
  const glowColor = isActive ? 'rgba(253,73,135,0.4)' : isDone ? 'rgba(34,197,94,0.4)' : 'transparent'

  return (
    <g
      style={{ cursor: 'pointer', opacity: isBacklog ? 0.5 : 1, transition: 'opacity 0.3s' }}
      onClick={() => onClick(project)}
    >
      {/* Active glow / selection */}
      {(isActive || isSelected) && (
        <ellipse cx={x} cy={y} rx={s * 0.55} ry={s * 0.45} fill="none"
          stroke={isSelected ? '#fd4987' : glowColor}
          strokeWidth={isSelected ? 2 : 3}
          strokeDasharray={isSelected ? '5 3' : 'none'}
          opacity={0.7}
        >
          {isActive && !isSelected && (
            <animate attributeName="opacity" values="0.7;0.3;0.7" dur="2.5s" repeatCount="indefinite" />
          )}
        </ellipse>
      )}

      {/* Water shadow */}
      <ellipse cx={x + 2} cy={y + s*0.22} rx={s * 0.4} ry={s * 0.12}
        fill="rgba(0,40,80,0.3)" />

      {/* Shallow water ring */}
      <path d={beachPath} fill="#1a6b8a" opacity="0.35" />

      {/* Beach / sand */}
      <path d={beachPath} fill="#e8d282" opacity="0.6"
        transform={`scale(0.92) translate(${x * 0.08} ${y * 0.08})`}
        style={{ transformOrigin: `${x}px ${y}px` }} />

      {/* Main island body */}
      <path d={islandPath} fill="#c4a84e" />

      {/* Green vegetation overlay */}
      {progress > 0 && (
        <path d={islandPath} fill={vegColor} opacity={Math.min(0.9, progress + 0.2)}
          transform={`scale(${0.5 + progress * 0.4})`}
          style={{ transformOrigin: `${x}px ${y}px` }} />
      )}

      {/* Terrain texture dots */}
      {[...Array(Math.min(6, Math.floor(progress * 8) + 1))].map((_, i) => {
        const angle = (i / 6) * Math.PI * 2 + hash * 0.1
        const dist = s * 0.15 * (0.5 + ((hash + i * 37) % 100) / 200)
        return (
          <circle key={i}
            cx={x + Math.cos(angle) * dist}
            cy={y + Math.sin(angle) * dist * 0.7}
            r={s * 0.025 + (i % 3) * s * 0.01}
            fill={vegDarkColor} opacity={0.5} />
        )
      })}

      {/* Palm trees — different styles */}
      {progress > 0.1 && (
        <g>
          {/* Tree trunk */}
          <path d={`M${x - s*0.06},${y + s*0.02} Q${x - s*0.08},${y - s*0.12} ${x - s*0.04},${y - s*0.22}`}
            stroke="#8B6914" strokeWidth={s*0.03} fill="none" strokeLinecap="round" />
          {/* Fronds */}
          <ellipse cx={x - s*0.02} cy={y - s*0.25} rx={s*0.09} ry={s*0.04} fill="#228B22" transform={`rotate(-20 ${x - s*0.02} ${y - s*0.25})`} />
          <ellipse cx={x - s*0.06} cy={y - s*0.23} rx={s*0.08} ry={s*0.035} fill="#2E8B2E" transform={`rotate(15 ${x - s*0.06} ${y - s*0.23})`} />
          <ellipse cx={x - s*0.01} cy={y - s*0.27} rx={s*0.07} ry={s*0.03} fill="#1E7B1E" transform={`rotate(-45 ${x - s*0.01} ${y - s*0.27})`} />
        </g>
      )}
      {progress > 0.35 && (
        <g>
          <path d={`M${x + s*0.1},${y + s*0.05} Q${x + s*0.12},${y - s*0.05} ${x + s*0.08},${y - s*0.15}`}
            stroke="#7B5B14" strokeWidth={s*0.025} fill="none" strokeLinecap="round" />
          <ellipse cx={x + s*0.1} cy={y - s*0.17} rx={s*0.07} ry={s*0.03} fill="#2E8B2E" transform={`rotate(10 ${x + s*0.1} ${y - s*0.17})`} />
          <ellipse cx={x + s*0.06} cy={y - s*0.16} rx={s*0.06} ry={s*0.025} fill="#228B22" transform={`rotate(-25 ${x + s*0.06} ${y - s*0.16})`} />
        </g>
      )}
      {progress > 0.65 && (
        <g>
          <path d={`M${x + s*0.02},${y - s*0.02} Q${x},${y - s*0.15} ${x + s*0.03},${y - s*0.28}`}
            stroke="#8B6914" strokeWidth={s*0.028} fill="none" strokeLinecap="round" />
          <ellipse cx={x + s*0.05} cy={y - s*0.3} rx={s*0.08} ry={s*0.035} fill="#1E7B1E" transform={`rotate(-15 ${x + s*0.05} ${y - s*0.3})`} />
          <ellipse cx={x} cy={y - s*0.29} rx={s*0.07} ry={s*0.03} fill="#228B22" transform={`rotate(20 ${x} ${y - s*0.29})`} />
          <ellipse cx={x + s*0.04} cy={y - s*0.32} rx={s*0.06} ry={s*0.025} fill="#2E8B2E" transform={`rotate(-40 ${x + s*0.04} ${y - s*0.32})`} />
        </g>
      )}

      {/* Small rocks */}
      <circle cx={x + s*0.2} cy={y + s*0.1} r={s*0.02} fill="#9e9e7e" opacity="0.6" />
      <circle cx={x - s*0.18} cy={y + s*0.12} r={s*0.015} fill="#8e8e6e" opacity="0.5" />

      {/* Status flag */}
      <line x1={x + s*0.25} y1={y - s*0.05} x2={x + s*0.25} y2={y - s*0.22} stroke="#5a5a5a" strokeWidth="1.5" />
      <polygon
        points={`${x + s*0.25},${y - s*0.22} ${x + s*0.35},${y - s*0.18} ${x + s*0.25},${y - s*0.14}`}
        fill={isDone ? '#22c55e' : isActive ? '#fd4987' : project.columnName === 'To Do' ? '#6130ba' : '#6b7280'}
      />

      {/* Done checkmark */}
      {isDone && <text x={x} y={y + s*0.05} textAnchor="middle" fontSize={s*0.2}>✅</text>}

      {/* Priority badge */}
      {(project.priority === 'urgent' || project.priority === 'high') && (
        <g>
          <circle cx={x - s*0.3} cy={y - s*0.22} r={s*0.06}
            fill={project.priority === 'urgent' ? '#ef4444' : '#f97316'} />
          <text x={x - s*0.3} y={y - s*0.19} textAnchor="middle" fontSize={s*0.06} fill="white" fontWeight="bold">
            {project.priority === 'urgent' ? '!' : '↑'}
          </text>
        </g>
      )}

      {/* Label background */}
      <rect x={x - s*0.45} y={y + s*0.34} width={s*0.9} height={s*0.18}
        rx="4" fill="rgba(0,0,0,0.65)" />

      {/* Label text */}
      <text x={x} y={y + s*0.46} textAnchor="middle"
        fill="white" fontSize={Math.max(10, s * 0.1)} fontWeight="600"
        style={{ textShadow: '0 1px 3px rgba(0,0,0,1)' }}>
        {project.title.length > 24 ? project.title.substring(0, 22) + '…' : project.title}
      </text>

      {/* Progress bar under label */}
      {totalTasks > 0 && (
        <g>
          <rect x={x - s*0.3} y={y + s*0.52} width={s*0.6} height={3} rx="1.5" fill="rgba(255,255,255,0.15)" />
          <rect x={x - s*0.3} y={y + s*0.52} width={s*0.6 * progress} height={3} rx="1.5"
            fill={progress > 0.7 ? '#22c55e' : progress > 0.3 ? '#eab308' : '#6b7280'} />
        </g>
      )}
    </g>
  )
}

/* ─── Miles's Boat ─── */
function MilesBoat({ fromX, fromY, toX, toY }: { fromX: number; fromY: number; toX: number; toY: number }) {
  return (
    <g>
      {/* Wake trail */}
      <line x1={fromX} y1={fromY} x2={toX} y2={toY - 10}
        stroke="rgba(255,255,255,0.08)" strokeWidth="3" strokeDasharray="8 6" />

      {/* Boat at destination */}
      <g>
        <animateMotion
          dur="4s"
          repeatCount="indefinite"
          path={`M${fromX},${fromY} Q${(fromX+toX)/2},${Math.min(fromY,toY)-20} ${toX},${toY - 15}`}
          fill="freeze"
        />
        {/* Hull */}
        <path d="M-12,4 Q-14,8 0,10 Q14,8 12,4 Z" fill="#8B4513" />
        <path d="M-10,4 L10,4 L8,0 L-8,0 Z" fill="#A0522D" />
        {/* Mast & sail */}
        <line x1="0" y1="0" x2="0" y2="-16" stroke="#5a3a1a" strokeWidth="1.5" />
        <path d="M0,-16 Q8,-10 2,-2 L0,-2 Z" fill="white" opacity="0.9" />
        {/* Miles emoji */}
        <text x="-1" y="-1" fontSize="8" textAnchor="middle">🤖</text>
        {/* Ripple */}
        <ellipse cx="0" cy="10" rx="16" ry="3" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1">
          <animate attributeName="rx" values="12;20;12" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.2;0;0.2" dur="2s" repeatCount="indefinite" />
        </ellipse>
      </g>
    </g>
  )
}

/* ─── Cloud decoration ─── */
function Cloud({ x, y, scale }: { x: number; y: number; scale: number }) {
  return (
    <g opacity="0.12" transform={`translate(${x},${y}) scale(${scale})`}>
      <ellipse cx="0" cy="0" rx="25" ry="10" fill="white" />
      <ellipse cx="-12" cy="-4" rx="15" ry="8" fill="white" />
      <ellipse cx="12" cy="-3" rx="18" ry="9" fill="white" />
      <ellipse cx="5" cy="-7" rx="12" ry="7" fill="white" />
      <animateTransform attributeName="transform" type="translate"
        from={`${x} ${y}`} to={`${x + 60} ${y}`}
        dur={`${30 + scale * 20}s`} repeatCount="indefinite" additive="replace" />
    </g>
  )
}

export default function MapView() {
  const [board, setBoard] = useState<Board | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState<ProjectWithMeta | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const fetchBoard = useCallback(async () => {
    try {
      const res = await fetch('/api/board')
      const data = await res.json()
      setBoard(data)
    } catch (error) {
      console.error('Failed to fetch board:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchBoard() }, [fetchBoard])

  const allProjects = useMemo(() => {
    if (!board) return []
    return board.columns.flatMap(c =>
      c.projects.map(p => ({ ...p, columnName: c.name, columnId: c.id }))
    ) as ProjectWithMeta[]
  }, [board])

  // Active project (what Miles is working on)
  const activeProject = useMemo(() =>
    allProjects.find(p => p.columnName === 'In Progress' && p.assignee === 'miles') ||
    allProjects.find(p => p.columnName === 'In Progress')
  , [allProjects])

  // Layout: fit all islands in viewport. Use a grid with enough spacing.
  const layout = useMemo(() => {
    const count = allProjects.length
    if (count === 0) return { positions: [], viewW: 800, viewH: 500 }

    // Determine grid dimensions
    const cols = count <= 4 ? 2 : count <= 6 ? 3 : count <= 9 ? 3 : 4
    const rows = Math.ceil(count / cols)

    // ViewBox sizing — wide to fit screen
    const cellW = 200
    const cellH = 175
    const padX = 80
    const padY = 70
    const viewW = cols * cellW + padX * 2
    const viewH = rows * cellH + padY * 2

    // Create natural-feeling positions with jitter
    const positions = allProjects.map((p, i) => {
      const col = i % cols
      const row = Math.floor(i / cols)
      const hash = p.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
      const jX = ((hash * 13) % 30) - 15
      const jY = ((hash * 17) % 20) - 10
      const x = padX + col * cellW + cellW / 2 + jX
      const y = padY + row * cellH + cellH / 2 + jY
      const isActive = p.columnName === 'In Progress'
      const size = isActive ? 85 : p.columnName === 'Backlog' ? 60 : 72
      return { x, y, size, project: p }
    })

    return { positions, viewW, viewH }
  }, [allProjects])

  // Find boat target position
  const boatTarget = useMemo(() => {
    if (!activeProject) return null
    return layout.positions.find(p => p.project.id === activeProject.id)
  }, [activeProject, layout.positions])

  // Boat origin — a dock in bottom-left
  const boatOriginX = 40
  const boatOriginY = layout.viewH - 40

  const handleTaskToggle = async (taskId: string, completed: boolean) => {
    await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed }),
    })
    fetchBoard()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#071422]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pink-500" />
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-[#071422] flex flex-col" style={{ height: '100vh', overflow: 'hidden' }}>
      {/* Header */}
      <header className="border-b border-white/10 bg-black/40 backdrop-blur-xl z-40 flex-shrink-0">
        <div className="max-w-full mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                  <span className="text-white font-bold text-xs">M</span>
                </div>
                <h1 className="text-lg font-bold text-white">Mission Control</h1>
              </Link>
              <span className="text-gray-500 text-sm hidden sm:block">— Island Overview</span>
            </div>
            <div className="flex items-center gap-3">
              <ViewToggle active="map" />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Ocean viewport — fills remaining space, NO scroll */}
      <div ref={containerRef} className="flex-1 relative" style={{ overflow: 'hidden' }}>
        {/* Background gradient */}
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse at 50% 30%, #0e2d50 0%, #091c35 40%, #071422 100%)',
        }} />

        {/* Animated wave overlay */}
        <div className="absolute inset-0 opacity-[0.06]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='120' height='20' viewBox='0 0 120 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 10 Q15 0 30 10 Q45 20 60 10 Q75 0 90 10 Q105 20 120 10' fill='none' stroke='%234a90d9' stroke-width='1.5'/%3E%3C/svg%3E")`,
          backgroundSize: '120px 20px',
          animation: 'waveScroll 8s linear infinite',
        }} />

        {/* Activity Status Banner */}
        {activeProject && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-black/60 backdrop-blur-md rounded-full px-5 py-2 border border-pink-500/30 flex items-center gap-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-pink-500"></span>
            </span>
            <span className="text-sm text-gray-300">
              <span className="text-white font-semibold">⚡ Miles</span> is sailing to{' '}
              <span className="text-pink-400 font-semibold">{activeProject.title}</span>
            </span>
          </div>
        )}

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm rounded-xl p-3 text-xs text-gray-400 z-10 border border-white/5">
          <div className="font-semibold text-white mb-2">🗺️ Legend</div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2"><div className="w-3 h-2 rounded" style={{ background: '#fd4987' }} /> In Progress</div>
            <div className="flex items-center gap-2"><div className="w-3 h-2 rounded" style={{ background: '#6130ba' }} /> To Do</div>
            <div className="flex items-center gap-2"><div className="w-3 h-2 rounded" style={{ background: '#22c55e' }} /> Done</div>
            <div className="flex items-center gap-2 opacity-50"><div className="w-3 h-2 rounded" style={{ background: '#6b7280' }} /> Backlog</div>
          </div>
        </div>

        {/* Dock label */}
        <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm rounded-xl p-3 text-xs text-gray-400 z-10 border border-white/5">
          <div className="text-white font-semibold mb-1">🤖 Miles — Agent</div>
          <div>Currently: {activeProject ? `Working on ${activeProject.title}` : 'Idle at dock'}</div>
        </div>

        {/* SVG Map — fits viewport exactly */}
        <svg
          viewBox={`0 0 ${layout.viewW} ${layout.viewH}`}
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Defs for water gradient */}
          <defs>
            <radialGradient id="waterGlow" cx="50%" cy="40%">
              <stop offset="0%" stopColor="#1a4a6e" stopOpacity="0.3" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
            <filter id="islandShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="2" dy="3" stdDeviation="4" floodColor="rgba(0,0,0,0.4)" />
            </filter>
          </defs>

          {/* Subtle water glow */}
          <rect x="0" y="0" width={layout.viewW} height={layout.viewH} fill="url(#waterGlow)" />

          {/* Clouds */}
          <Cloud x={80} y={30} scale={0.8} />
          <Cloud x={layout.viewW - 200} y={50} scale={0.6} />
          <Cloud x={layout.viewW / 2 - 50} y={20} scale={0.5} />

          {/* Small decorative wave lines */}
          {[...Array(5)].map((_, i) => (
            <path key={i}
              d={`M${30 + i * layout.viewW / 5},${layout.viewH * 0.3 + i * 40} q20,-5 40,0 q20,5 40,0`}
              fill="none" stroke="rgba(74,144,217,0.08)" strokeWidth="1" />
          ))}

          {/* Dock at bottom-left */}
          <g>
            <rect x={boatOriginX - 15} y={boatOriginY - 8} width="30" height="16" rx="3" fill="#5a3a1a" opacity="0.6" />
            <rect x={boatOriginX - 12} y={boatOriginY - 5} width="24" height="10" rx="2" fill="#7B5B14" opacity="0.5" />
            <line x1={boatOriginX - 15} y1={boatOriginY + 8} x2={boatOriginX - 15} y2={boatOriginY + 20} stroke="#5a3a1a" strokeWidth="2" opacity="0.3" />
          </g>

          {/* Islands */}
          {layout.positions.map(({ x, y, size, project }) => (
            <Island
              key={project.id}
              project={project}
              x={x} y={y} size={size}
              onClick={setSelectedProject}
              isSelected={selectedProject?.id === project.id}
              isBoatTarget={activeProject?.id === project.id}
            />
          ))}

          {/* Miles's boat sailing to active project */}
          {boatTarget && (
            <MilesBoat
              fromX={boatOriginX}
              fromY={boatOriginY}
              toX={boatTarget.x - boatTarget.size * 0.5}
              toY={boatTarget.y + boatTarget.size * 0.35}
            />
          )}
        </svg>
      </div>

      {/* Detail panel */}
      {selectedProject && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-96 max-w-[calc(100vw-2rem)] bg-black/80 backdrop-blur-xl rounded-2xl border border-white/10 p-5 z-50 shadow-2xl">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-white">{selectedProject.title}</h3>
            <button onClick={() => setSelectedProject(null)} className="text-gray-400 hover:text-white text-lg">✕</button>
          </div>
          {selectedProject.description && (
            <p className="text-sm text-gray-400 mb-3">{selectedProject.description}</p>
          )}
          <div className="flex items-center gap-3 text-xs text-gray-500 mb-3 flex-wrap">
            <span className={`px-2 py-0.5 rounded ${
              selectedProject.columnName === 'In Progress' ? 'bg-pink-500/20 text-pink-400' :
              selectedProject.columnName === 'Done' ? 'bg-green-500/20 text-green-400' :
              selectedProject.columnName === 'To Do' ? 'bg-purple-500/20 text-purple-400' :
              'bg-white/10 text-gray-400'
            }`}>{selectedProject.columnName}</span>
            <span className="capitalize">{selectedProject.priority} priority</span>
            {selectedProject.assignee && (
              <span>{selectedProject.assignee === 'blake' ? '👨‍💻 Blake' : '🤖 Miles'}</span>
            )}
          </div>
          {selectedProject.tasks?.length > 0 && (
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {selectedProject.tasks.map(task => (
                <div key={task.id} className="flex items-center gap-2">
                  <button
                    onClick={() => handleTaskToggle(task.id, !task.completed)}
                    className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition ${
                      task.completed ? 'bg-green-500 border-green-500' : 'border-gray-500 hover:border-pink-500'
                    }`}
                  >
                    {task.completed && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                  <span className={`text-xs ${task.completed ? 'text-gray-500 line-through' : 'text-gray-300'}`}>
                    {task.title || 'Task'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        @keyframes waveScroll {
          from { background-position-x: 0; }
          to { background-position-x: 120px; }
        }
      `}</style>
    </main>
  )
}
