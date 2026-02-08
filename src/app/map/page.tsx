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

function Island({ project, index, onClick, isSelected }: {
  project: ProjectWithMeta
  index: number
  onClick: (p: ProjectWithMeta) => void
  isSelected: boolean
}) {
  const completedTasks = project.tasks?.filter(t => t.completed).length || 0
  const totalTasks = project.tasks?.length || 0
  const progress = totalTasks > 0 ? completedTasks / totalTasks : 0
  const isActive = project.columnName === 'In Progress'
  const isDone = project.columnName === 'Done'
  const isBacklog = project.columnName === 'Backlog'

  // Island size based on task count
  const baseSize = Math.max(80, Math.min(150, 80 + (totalTasks * 15)))

  // Scatter layout — 3 columns with natural jitter
  const seed = project.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const cols = 3
  const row = Math.floor(index / cols)
  const col = index % cols
  const jX = ((seed * 13) % 50) - 25
  const jY = ((seed * 17) % 30) - 15
  const x = 120 + col * 220 + jX
  const y = 80 + row * 150 + jY

  // Colors
  const sandColor = '#f4d03f'
  const lushColor = progress > 0.7 ? '#27ae60' : progress > 0.3 ? '#82e0aa' : sandColor
  const ringColor = project.priority === 'urgent' ? '#ef4444'
    : project.priority === 'high' ? '#f97316'
    : 'transparent'

  return (
    <g
      style={{ cursor: 'pointer', opacity: isBacklog ? 0.45 : 1 }}
      onClick={() => onClick(project)}
    >
      {/* Water ripple for active */}
      {isActive && (
        <circle cx={x} cy={y} r={baseSize * 0.7} fill="none" stroke="rgba(253,73,135,0.2)" strokeWidth="2">
          <animate attributeName="r" values={`${baseSize*0.5};${baseSize*0.8};${baseSize*0.5}`} dur="3s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.3;0;0.3" dur="3s" repeatCount="indefinite" />
        </circle>
      )}

      {/* Priority ring */}
      {ringColor !== 'transparent' && (
        <circle cx={x} cy={y} r={baseSize * 0.48} fill="none" stroke={ringColor} strokeWidth="2.5" strokeDasharray="6 4" opacity="0.6">
          <animateTransform attributeName="transform" type="rotate" from={`0 ${x} ${y}`} to={`360 ${x} ${y}`} dur="12s" repeatCount="indefinite" />
        </circle>
      )}

      {/* Shadow */}
      <ellipse cx={x + 3} cy={y + 4} rx={baseSize * 0.38} ry={baseSize * 0.28} fill="rgba(0,0,0,0.25)" />

      {/* Beach / sand ring */}
      <ellipse cx={x} cy={y} rx={baseSize * 0.4} ry={baseSize * 0.3} fill="#e8c838" stroke="#c9a825" strokeWidth="1" />

      {/* Island base */}
      <ellipse cx={x} cy={y} rx={baseSize * 0.35} ry={baseSize * 0.26} fill={sandColor} />

      {/* Vegetation (grows with progress) */}
      {progress > 0 && (
        <ellipse
          cx={x} cy={y - 2}
          rx={baseSize * 0.3 * Math.max(0.3, progress)}
          ry={baseSize * 0.22 * Math.max(0.3, progress)}
          fill={lushColor}
          opacity={0.85}
        />
      )}

      {/* Palm trees */}
      {progress > 0.15 && (
        <>
          {/* Tree 1 */}
          <line x1={x - 8} y1={y} x2={x - 6} y2={y - 18} stroke="#6b4226" strokeWidth="2" />
          <ellipse cx={x - 3} cy={y - 20} rx="8" ry="5" fill="#229954" />
          <ellipse cx={x - 10} cy={y - 17} rx="6" ry="4" fill="#27ae60" />
        </>
      )}
      {progress > 0.4 && (
        <>
          {/* Tree 2 */}
          <line x1={x + 10} y1={y + 2} x2={x + 8} y2={y - 14} stroke="#6b4226" strokeWidth="2" />
          <ellipse cx={x + 11} cy={y - 16} rx="7" ry="4" fill="#1e8449" />
          <ellipse cx={x + 5} cy={y - 13} rx="5" ry="3" fill="#229954" />
        </>
      )}
      {progress > 0.7 && (
        <>
          {/* Tree 3 */}
          <line x1={x + 2} y1={y - 3} x2={x + 1} y2={y - 22} stroke="#6b4226" strokeWidth="2" />
          <ellipse cx={x + 4} cy={y - 24} rx="9" ry="5" fill="#196f3d" />
          <ellipse cx={x - 3} cy={y - 21} rx="7" ry="4" fill="#1e8449" />
        </>
      )}

      {/* Small rocks/details */}
      <circle cx={x + baseSize * 0.2} cy={y + baseSize * 0.1} r="2" fill="#bbb" opacity="0.5" />
      <circle cx={x - baseSize * 0.15} cy={y + baseSize * 0.15} r="1.5" fill="#aaa" opacity="0.5" />

      {/* Flag */}
      <line x1={x + baseSize * 0.22} y1={y - baseSize * 0.05} x2={x + baseSize * 0.22} y2={y - baseSize * 0.28} stroke="#555" strokeWidth="1.5" />
      <polygon
        points={`${x + baseSize * 0.22},${y - baseSize * 0.28} ${x + baseSize * 0.35},${y - baseSize * 0.23} ${x + baseSize * 0.22},${y - baseSize * 0.18}`}
        fill={isDone ? '#22c55e' : isActive ? '#fd4987' : '#6130ba'}
      />

      {/* Done overlay */}
      {isDone && <text x={x} y={y + 3} textAnchor="middle" fontSize="18">✅</text>}

      {/* Assignee */}
      {project.assignee && (
        <text x={x - baseSize * 0.28} y={y - baseSize * 0.12} fontSize="13">
          {project.assignee === 'blake' ? '👨‍💻' : '🤖'}
        </text>
      )}

      {/* Label */}
      <text
        x={x} y={y + baseSize * 0.42}
        textAnchor="middle"
        fill={isSelected ? '#fd4987' : 'white'}
        fontSize="11"
        fontWeight={isSelected ? 'bold' : 'normal'}
        style={{ textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}
      >
        {project.title.length > 22 ? project.title.substring(0, 20) + '…' : project.title}
      </text>

      {/* Progress */}
      {totalTasks > 0 && (
        <text x={x} y={y + baseSize * 0.54} textAnchor="middle" fill="#94a3b8" fontSize="9">
          {completedTasks}/{totalTasks} tasks
        </text>
      )}

      {/* Selection ring */}
      {isSelected && (
        <ellipse cx={x} cy={y} rx={baseSize * 0.5} ry={baseSize * 0.38} fill="none" stroke="#fd4987" strokeWidth="2" strokeDasharray="4 3" />
      )}
    </g>
  )
}

export default function MapView() {
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
    // Re-select to get updated data
    if (selectedProject) {
      const updated = allProjects.find(p => p.id === selectedProject.id)
      if (updated) setSelectedProject(updated)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a1628]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pink-500" />
      </div>
    )
  }

  // Compute SVG viewBox height dynamically
  const rows = Math.ceil(allProjects.length / 3)
  const svgH = Math.max(400, rows * 150 + 100)

  return (
    <main className="min-h-screen bg-[#0a1628] overflow-hidden">
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
              <span className="text-gray-500 text-sm hidden sm:block">— Island Overview</span>
            </div>
            <div className="flex items-center gap-3">
              <ViewToggle active="map" />
              <SearchBar />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Ocean */}
      <div className="relative" style={{ height: 'calc(100vh - 56px)', overflow: 'auto' }}>
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse at 50% 30%, #0d2847 0%, #0a1628 50%, #060f1d 100%)',
          minHeight: `${svgH + 50}px`,
        }}>
          {/* Wave overlay */}
          <div className="absolute inset-0 opacity-[0.07]" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='20' viewBox='0 0 100 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M21.184 20c.357-.13.72-.264 1.088-.402l1.768-.661C33.64 15.347 39.647 14 50 14c10.271 0 15.362 1.222 24.629 4.928.955.383 1.869.74 2.75 1.072h6.225c-2.51-.73-5.139-1.691-8.233-2.928C65.888 13.278 60.562 12 50 12c-10.626 0-16.855 1.397-26.66 5.063l-1.767.662c-2.475.923-4.66 1.674-6.724 2.275h6.335zm0-20C13.258 2.892 8.077 4 0 4V2c5.744 0 9.951-.574 14.85-2h6.334zM77.38 0C85.239 2.966 90.502 4 100 4V2c-6.842 0-11.386-.542-16.396-2h-6.225zM0 14c8.44 0 13.718-1.21 22.272-4.402l1.768-.661C33.64 5.347 39.647 4 50 4c10.271 0 15.362 1.222 24.629 4.928C84.112 12.722 89.438 14 100 14v-2c-10.271 0-15.362-1.222-24.629-4.928C65.888 3.278 60.562 2 50 2 39.374 2 33.145 3.397 23.34 7.063l-1.767.662C13.223 10.84 8.163 12 0 12v2z' fill='%234a90d9' fill-opacity='0.4' fill-rule='evenodd'/%3E%3C/svg%3E")`,
            animation: 'wave 10s linear infinite',
          }} />
        </div>

        {/* Legend */}
        <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm rounded-xl p-3 text-xs text-gray-400 z-10 border border-white/5">
          <div className="font-semibold text-white mb-2">🗺️ Legend</div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#f4d03f]" /> Barren (0%)</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#82e0aa]" /> Growing (30%+)</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#27ae60]" /> Lush (70%+)</div>
            <div className="flex items-center gap-2"><div className="w-3 h-2 rounded" style={{ background: '#fd4987' }} /> Active</div>
            <div className="flex items-center gap-2"><div className="w-3 h-2 rounded" style={{ background: '#6130ba' }} /> Queued</div>
            <div className="flex items-center gap-2 opacity-50"><div className="w-3 h-3 rounded-full bg-gray-500" /> Backlog</div>
          </div>
        </div>

        {/* SVG Map */}
        <svg viewBox={`0 0 700 ${svgH}`} className="relative w-full" style={{ minHeight: `${svgH}px` }}>
          {allProjects.map((project, i) => (
            <Island
              key={project.id}
              project={project}
              index={i}
              
              onClick={setSelectedProject}
              isSelected={selectedProject?.id === project.id}
            />
          ))}
        </svg>

        {/* Detail panel */}
        {selectedProject && (
          <div className="fixed bottom-4 right-4 w-80 bg-black/70 backdrop-blur-xl rounded-2xl border border-white/10 p-4 z-30">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-white text-sm">{selectedProject.title}</h3>
              <button onClick={() => setSelectedProject(null)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            {selectedProject.description && <p className="text-xs text-gray-400 mb-3">{selectedProject.description}</p>}
            <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
              <span className={`px-2 py-0.5 rounded ${
                selectedProject.columnName === 'In Progress' ? 'bg-pink-500/20 text-pink-400' :
                selectedProject.columnName === 'Done' ? 'bg-green-500/20 text-green-400' :
                'bg-white/10 text-gray-400'
              }`}>{selectedProject.columnName}</span>
              <span>{selectedProject.priority} priority</span>
              {selectedProject.assignee && <span>{selectedProject.assignee === 'blake' ? '👨‍💻 Blake' : '🤖 Miles'}</span>}
            </div>
            {selectedProject.tasks?.length > 0 && (
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
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

      <style jsx>{`
        @keyframes wave {
          from { background-position-x: 0; }
          to { background-position-x: 100px; }
        }
      `}</style>
    </main>
  )
}
