'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Board } from '@/types'
import { ThemeToggle } from '@/components/ThemeToggle'
import { ViewToggle } from '@/components/ViewToggle'
import { SearchBar } from '@/components/SearchBar'
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

function SpaceModule({ project, index, total, onClick, isSelected }: {
  project: ProjectWithMeta
  index: number
  total: number
  onClick: (p: ProjectWithMeta) => void
  isSelected: boolean
}) {
  const completedTasks = project.tasks?.filter(t => t.completed).length || 0
  const totalTasks = project.tasks?.length || 0
  const progress = totalTasks > 0 ? completedTasks / totalTasks : 0
  const isActive = project.columnName === 'In Progress'
  const isDone = project.columnName === 'Done'
  const isBacklog = project.columnName === 'Backlog'

  const moduleW = Math.max(100, Math.min(160, 100 + (totalTasks * 10)))
  const moduleH = moduleW * 0.5

  // Orbital positioning
  const angle = (index / Math.max(total, 1)) * Math.PI * 2 - Math.PI / 2
  const ring = 170 + (index % 2) * 55
  const cx = 380 + Math.cos(angle) * ring
  const cy = 250 + Math.sin(angle) * ring * 0.65

  const glowColor = isDone ? '#22c55e' : isActive ? '#fd4987' : project.priority === 'urgent' ? '#ef4444' : project.priority === 'high' ? '#f97316' : '#6130ba'
  const hullColor = isDone ? '#0f2a1a' : isActive ? '#2a0f1a' : '#0f1525'
  const statusLight = isDone ? '#22c55e' : isActive ? '#fd4987' : '#4b5563'
  const energyColor = progress > 0.7 ? '#22c55e' : progress > 0.4 ? '#eab308' : '#ef4444'

  return (
    <g style={{ cursor: 'pointer' }} onClick={() => onClick(project)} opacity={isBacklog ? 0.4 : 1}>
      {/* Connection beam to hub */}
      <line x1={380} y1={250} x2={cx} y2={cy} stroke={glowColor} strokeWidth="0.8" opacity="0.12" strokeDasharray="3 6">
        {isActive && <animate attributeName="stroke-dashoffset" values="0;-9" dur="1s" repeatCount="indefinite" />}
      </line>

      {/* Module glow */}
      <ellipse cx={cx} cy={cy} rx={moduleW * 0.5} ry={moduleH * 0.5} fill={glowColor} opacity={isActive ? 0.12 : 0.04}>
        {isActive && <animate attributeName="opacity" values="0.12;0.05;0.12" dur="2.5s" repeatCount="indefinite" />}
      </ellipse>

      {/* Module body */}
      <rect
        x={cx - moduleW / 2} y={cy - moduleH / 2}
        width={moduleW} height={moduleH}
        rx="6"
        fill={hullColor}
        stroke={isSelected ? '#fd4987' : glowColor}
        strokeWidth={isSelected ? 2.5 : 0.8}
      />

      {/* Hull lines (detail) */}
      <line x1={cx - moduleW / 2 + 8} y1={cy - moduleH / 2} x2={cx - moduleW / 2 + 8} y2={cy + moduleH / 2} stroke={glowColor} strokeWidth="0.3" opacity="0.3" />
      <line x1={cx + moduleW / 2 - 8} y1={cy - moduleH / 2} x2={cx + moduleW / 2 - 8} y2={cy + moduleH / 2} stroke={glowColor} strokeWidth="0.3" opacity="0.3" />

      {/* Solar panel left */}
      <rect x={cx - moduleW / 2 - 22} y={cy - 5} width="20" height="10" rx="1" fill="#0a1a30" stroke="#1a3a6a" strokeWidth="0.5" />
      <line x1={cx - moduleW / 2 - 12} y1={cy - 5} x2={cx - moduleW / 2 - 12} y2={cy + 5} stroke="#1a3a6a" strokeWidth="0.3" />
      <line x1={cx - moduleW / 2 - 17} y1={cy} x2={cx - moduleW / 2 - 3} y2={cy} stroke="#1a3a6a" strokeWidth="0.3" />

      {/* Solar panel right */}
      <rect x={cx + moduleW / 2 + 2} y={cy - 5} width="20" height="10" rx="1" fill="#0a1a30" stroke="#1a3a6a" strokeWidth="0.5" />
      <line x1={cx + moduleW / 2 + 12} y1={cy - 5} x2={cx + moduleW / 2 + 12} y2={cy + 5} stroke="#1a3a6a" strokeWidth="0.3" />
      <line x1={cx + moduleW / 2 + 7} y1={cy} x2={cx + moduleW / 2 + 17} y2={cy} stroke="#1a3a6a" strokeWidth="0.3" />

      {/* Status LED */}
      <circle cx={cx - moduleW / 2 + 14} cy={cy - moduleH / 2 + 9} r="3" fill={statusLight}>
        {isActive && <animate attributeName="opacity" values="1;0.2;1" dur="1.5s" repeatCount="indefinite" />}
      </circle>

      {/* Module name */}
      <text x={cx} y={cy - 3} textAnchor="middle" fill="white" fontSize="10" fontWeight="600" fontFamily="sans-serif">
        {project.title.length > 16 ? project.title.substring(0, 14) + '…' : project.title}
      </text>

      {/* Energy bar */}
      {totalTasks > 0 && (
        <>
          <rect x={cx - moduleW * 0.32} y={cy + 8} width={moduleW * 0.64} height="4" rx="2" fill="rgba(255,255,255,0.08)" />
          <rect x={cx - moduleW * 0.32} y={cy + 8} width={moduleW * 0.64 * progress} height="4" rx="2" fill={energyColor} />
          <text x={cx + moduleW * 0.35} y={cy + 12} fill="#64748b" fontSize="7" fontFamily="monospace">{completedTasks}/{totalTasks}</text>
        </>
      )}

      {/* Assignee */}
      {project.assignee && (
        <text x={cx + moduleW / 2 - 15} y={cy - moduleH / 2 + 12} fontSize="10">
          {project.assignee === 'blake' ? '👨‍💻' : '🤖'}
        </text>
      )}

      {/* Done badge */}
      {isDone && <text x={cx} y={cy + moduleH / 2 + 14} textAnchor="middle" fontSize="12">✅</text>}
    </g>
  )
}

export default function SpaceView() {
  const [board, setBoard] = useState<Board | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState<ProjectWithMeta | null>(null)

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
      <div className="flex items-center justify-center min-h-screen bg-[#050a15]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pink-500" />
      </div>
    )
  }

  const activeCount = allProjects.filter(p => p.columnName === 'In Progress').length
  const totalTasks = allProjects.reduce((s, p) => s + (p.tasks?.length || 0), 0)
  const completedTasks = allProjects.reduce((s, p) => s + (p.tasks?.filter(t => t.completed).length || 0), 0)

  return (
    <main className="min-h-screen bg-[#050a15] overflow-hidden">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/30 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-full mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                  <span className="text-white font-bold text-xs">M</span>
                </div>
                <h1 className="text-lg font-bold text-white">Mission Control</h1>
              </Link>
              <span className="text-gray-500 text-sm hidden sm:block">— Space Station</span>
            </div>
            <div className="flex items-center gap-3">
              <ViewToggle active="space" />
              <SearchBar />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <div className="relative" style={{ height: 'calc(100vh - 56px)' }}>
        {/* Starfield */}
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse at 40% 40%, #0a1225 0%, #050a15 70%)',
        }}>
          <div className="absolute inset-0" style={{
            backgroundImage: Array.from({ length: 40 }, (_, i) => {
              const x = ((i * 37 + 13) % 100)
              const y = ((i * 53 + 7) % 100)
              const s = (i % 3 === 0) ? 1.5 : 1
              const o = 0.2 + (i % 5) * 0.1
              return `radial-gradient(${s}px ${s}px at ${x}% ${y}%, rgba(255,255,255,${o}) 0%, transparent 100%)`
            }).join(','),
          }} />
        </div>

        {/* HUD */}
        <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm rounded-xl p-3 text-xs z-10 border border-white/5 font-mono">
          <div className="text-green-400 mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            STATION ONLINE
          </div>
          <div className="space-y-1 text-gray-400">
            <div>MODULES <span className="text-white ml-2">{allProjects.length}</span></div>
            <div>ACTIVE <span className="text-pink-400 ml-4">{activeCount}</span></div>
            <div>TASKS <span className="text-white ml-5">{completedTasks}<span className="text-gray-600">/{totalTasks}</span></span></div>
            <div className="pt-1 border-t border-white/10">
              SYS EFF <span className={`ml-3 ${totalTasks > 0 ? (completedTasks/totalTasks > 0.5 ? 'text-green-400' : 'text-yellow-400') : 'text-gray-600'}`}>
                {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>

        {/* SVG Station */}
        <svg viewBox="0 0 760 500" className="absolute inset-0 w-full h-full">
          {/* Orbital rings */}
          <ellipse cx="380" cy="250" rx="170" ry="110" fill="none" stroke="rgba(100,130,200,0.06)" strokeWidth="1" strokeDasharray="4 8" />
          <ellipse cx="380" cy="250" rx="225" ry="146" fill="none" stroke="rgba(100,130,200,0.04)" strokeWidth="1" strokeDasharray="4 8" />

          {/* Center hub */}
          <circle cx="380" cy="250" r="32" fill="#080d18" stroke="#6130ba" strokeWidth="2" />
          <circle cx="380" cy="250" r="22" fill="#080d18" stroke="#fd4987" strokeWidth="1" />
          <text x="380" y="246" textAnchor="middle" fill="#fd4987" fontSize="7" fontWeight="bold" fontFamily="monospace">MISSION</text>
          <text x="380" y="258" textAnchor="middle" fill="#6130ba" fontSize="7" fontWeight="bold" fontFamily="monospace">CONTROL</text>

          {/* Hub pulse */}
          <circle cx="380" cy="250" r="32" fill="none" stroke="#fd4987" strokeWidth="0.8" opacity="0.4">
            <animate attributeName="r" values="32;50;32" dur="4s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.4;0;0.4" dur="4s" repeatCount="indefinite" />
          </circle>

          {allProjects.map((project, i) => (
            <SpaceModule
              key={project.id}
              project={project}
              index={i}
              total={allProjects.length}
              onClick={setSelectedProject}
              isSelected={selectedProject?.id === project.id}
            />
          ))}
        </svg>

        {/* Detail panel */}
        {selectedProject && (
          <div className="fixed bottom-4 right-4 w-80 bg-black/70 backdrop-blur-xl rounded-2xl border border-white/10 p-4 z-30 font-mono">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-white text-sm">◉ {selectedProject.title}</h3>
              <button onClick={() => setSelectedProject(null)} className="text-gray-400 hover:text-white text-xs">[ CLOSE ]</button>
            </div>
            {selectedProject.description && <p className="text-xs text-gray-400 mb-3 font-sans">{selectedProject.description}</p>}
            <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
              <span className={`px-2 py-0.5 rounded ${
                selectedProject.columnName === 'In Progress' ? 'bg-pink-500/20 text-pink-400' :
                selectedProject.columnName === 'Done' ? 'bg-green-500/20 text-green-400' :
                'bg-white/10 text-gray-400'
              }`}>{selectedProject.columnName}</span>
              <span>{selectedProject.priority}</span>
              {selectedProject.assignee && <span>{selectedProject.assignee === 'blake' ? '👨‍💻' : '🤖'}</span>}
            </div>
            {selectedProject.tasks?.length > 0 && (
              <div className="space-y-1.5 max-h-40 overflow-y-auto font-sans">
                {selectedProject.tasks.map(task => (
                  <div key={task.id} className="flex items-center gap-2">
                    <button
                      onClick={() => handleTaskToggle(task.id, !task.completed)}
                      className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center ${task.completed ? 'bg-green-500 border-green-500' : 'border-gray-500 hover:border-pink-500'}`}
                    >
                      {task.completed && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                    </button>
                    <span className={`text-xs ${task.completed ? 'text-gray-500 line-through' : 'text-gray-300'}`}>{task.title || 'Task'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
