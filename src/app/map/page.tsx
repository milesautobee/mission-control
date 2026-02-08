'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
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

/* ─── Enhanced SVG Island ─── */
function Island({ project, x, y, size, onClick, isSelected, hasBoat }: {
  project: ProjectWithMeta
  x: number; y: number; size: number
  onClick: (p: ProjectWithMeta) => void
  isSelected: boolean
  hasBoat: boolean
}) {
  const completedTasks = project.tasks?.filter(t => t.completed).length || 0
  const totalTasks = project.tasks?.length || 0
  const progress = totalTasks > 0 ? completedTasks / totalTasks : 0
  const isActive = project.columnName === 'In Progress'
  const isDone = project.columnName === 'Done'
  const isBacklog = project.columnName === 'Backlog'

  const s = size
  const hash = project.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const shapeVar = hash % 4

  // More detailed island paths with coves and peninsulas
  const islandPaths: Record<number, string> = {
    0: `M${x-s*0.35},${y+s*0.02} C${x-s*0.38},${y-s*0.1} ${x-s*0.36},${y-s*0.25} ${x-s*0.18},${y-s*0.3}
        C${x-s*0.08},${y-s*0.34} ${x+s*0.05},${y-s*0.32} ${x+s*0.18},${y-s*0.28}
        C${x+s*0.32},${y-s*0.22} ${x+s*0.4},${y-s*0.08} ${x+s*0.38},${y+s*0.05}
        C${x+s*0.36},${y+s*0.15} ${x+s*0.28},${y+s*0.24} ${x+s*0.12},${y+s*0.26}
        C${x-s*0.05},${y+s*0.3} ${x-s*0.2},${y+s*0.28} ${x-s*0.3},${y+s*0.18}
        C${x-s*0.36},${y+s*0.12} ${x-s*0.35},${y+s*0.06} ${x-s*0.35},${y+s*0.02} Z`,
    1: `M${x-s*0.32},${y-s*0.05} C${x-s*0.35},${y-s*0.18} ${x-s*0.28},${y-s*0.3} ${x-s*0.1},${y-s*0.32}
        C${x+s*0.08},${y-s*0.35} ${x+s*0.25},${y-s*0.28} ${x+s*0.35},${y-s*0.15}
        C${x+s*0.42},${y-s*0.02} ${x+s*0.4},${y+s*0.12} ${x+s*0.32},${y+s*0.2}
        C${x+s*0.2},${y+s*0.3} ${x+s*0.05},${y+s*0.28} ${x-s*0.08},${y+s*0.3}
        C${x-s*0.22},${y+s*0.28} ${x-s*0.32},${y+s*0.18} ${x-s*0.35},${y+s*0.08}
        C${x-s*0.36},${y+s*0.02} ${x-s*0.34},${y-s*0.02} ${x-s*0.32},${y-s*0.05} Z`,
    2: `M${x-s*0.28},${y+s*0.08} C${x-s*0.38},${y-s*0.02} ${x-s*0.36},${y-s*0.2} ${x-s*0.2},${y-s*0.3}
        C${x-s*0.05},${y-s*0.38} ${x+s*0.15},${y-s*0.34} ${x+s*0.3},${y-s*0.22}
        C${x+s*0.4},${y-s*0.1} ${x+s*0.42},${y+s*0.08} ${x+s*0.32},${y+s*0.2}
        C${x+s*0.22},${y+s*0.3} ${x+s*0.08},${y+s*0.32} ${x-s*0.1},${y+s*0.28}
        C${x-s*0.2},${y+s*0.26} ${x-s*0.25},${y+s*0.18} ${x-s*0.28},${y+s*0.08} Z`,
    3: `M${x-s*0.3},${y-s*0.08} C${x-s*0.32},${y-s*0.22} ${x-s*0.2},${y-s*0.32} ${x-s*0.02},${y-s*0.3}
        C${x+s*0.12},${y-s*0.35} ${x+s*0.28},${y-s*0.28} ${x+s*0.36},${y-s*0.12}
        C${x+s*0.4},${y+s*0.02} ${x+s*0.38},${y+s*0.18} ${x+s*0.25},${y+s*0.26}
        C${x+s*0.1},${y+s*0.32} ${x-s*0.08},${y+s*0.3} ${x-s*0.22},${y+s*0.22}
        C${x-s*0.32},${y+s*0.14} ${x-s*0.34},${y+s*0.02} ${x-s*0.3},${y-s*0.08} Z`,
  }

  const mainPath = islandPaths[shapeVar]

  // Vegetation & terrain colors
  const sandLight = '#e8d490'
  const sandDark = '#d4bc6a'
  const vegLight = progress > 0.7 ? '#2d9d5a' : progress > 0.3 ? '#4ab87a' : '#7cc99a'
  const vegDark = progress > 0.7 ? '#1a7a3f' : progress > 0.3 ? '#2e8a55' : '#4aaa70'

  return (
    <g
      style={{ cursor: 'pointer', opacity: isBacklog ? 0.45 : 1, transition: 'opacity 0.3s' }}
      onClick={() => onClick(project)}
    >
      {/* Selection ring only */}
      {isSelected && (
        <ellipse cx={x} cy={y} rx={s * 0.55} ry={s * 0.42} fill="none"
          stroke="#fd4987" strokeWidth={2.5} strokeDasharray="6 4" opacity={0.7} />
      )}

      {/* Water shadow beneath island */}
      <ellipse cx={x + 3} cy={y + s*0.2} rx={s * 0.38} ry={s * 0.12}
        fill="rgba(0,30,60,0.35)" />

      {/* Shallow water / reef ring */}
      <path d={mainPath} fill="#1a7a9a" opacity="0.2"
        transform={`scale(1.15)`}
        style={{ transformOrigin: `${x}px ${y}px` }} />

      {/* Beach / sand outline */}
      <path d={mainPath} fill={sandLight}
        transform={`scale(1.06)`}
        style={{ transformOrigin: `${x}px ${y}px` }} />

      {/* Main island surface */}
      <path d={mainPath} fill={sandDark} />

      {/* Interior terrain — darker center */}
      <path d={mainPath} fill="#c4a855" opacity="0.6"
        transform="scale(0.85)"
        style={{ transformOrigin: `${x}px ${y}px` }} />

      {/* Vegetation layer */}
      {progress > 0 && (
        <>
          <path d={mainPath} fill={vegLight}
            opacity={Math.min(0.85, progress * 0.9 + 0.15)}
            transform={`scale(${0.4 + progress * 0.45})`}
            style={{ transformOrigin: `${x}px ${y}px` }} />
          {/* Darker vegetation patches */}
          {progress > 0.25 && (
            <path d={mainPath} fill={vegDark}
              opacity={0.4}
              transform={`scale(${0.25 + progress * 0.3})`}
              style={{ transformOrigin: `${x}px ${y}px` }} />
          )}
        </>
      )}

      {/* Terrain details — small bumps and texture */}
      {[...Array(Math.min(8, Math.floor(progress * 10) + 2))].map((_, i) => {
        const angle = (i / 8) * Math.PI * 2 + hash * 0.13
        const dist = s * (0.08 + ((hash + i * 41) % 100) / 600)
        const r = s * 0.015 + (i % 3) * s * 0.008
        return (
          <circle key={`t${i}`}
            cx={x + Math.cos(angle) * dist}
            cy={y + Math.sin(angle) * dist * 0.75}
            r={r}
            fill={i % 2 === 0 ? vegDark : '#b5a44e'} opacity={0.35} />
        )
      })}

      {/* Rocky outcrops on shore */}
      <circle cx={x + s*0.28} cy={y + s*0.12} r={s*0.025} fill="#8a8a6a" opacity="0.5" />
      <circle cx={x - s*0.26} cy={y + s*0.15} r={s*0.02} fill="#7a7a5a" opacity="0.4" />
      <circle cx={x + s*0.18} cy={y + s*0.2} r={s*0.015} fill="#9a9a7a" opacity="0.4" />

      {/* Palm trees — detailed with coconuts */}
      {progress > 0.08 && (
        <g>
          <path d={`M${x-s*0.08},${y+s*0.04} C${x-s*0.1},${y-s*0.04} ${x-s*0.09},${y-s*0.14} ${x-s*0.05},${y-s*0.22}`}
            stroke="#6B4226" strokeWidth={s*0.03} fill="none" strokeLinecap="round" />
          {/* Trunk segments */}
          {[0.3, 0.5, 0.7].map((t, i) => (
            <line key={`s1${i}`}
              x1={x-s*0.08 + t*(s*0.03)} y1={y+s*0.04 - t*(s*0.26)}
              x2={x-s*0.06 + t*(s*0.03)} y2={y+s*0.04 - t*(s*0.26) - s*0.01}
              stroke="#5a3518" strokeWidth={s*0.015} opacity="0.3" />
          ))}
          {/* Fronds */}
          <path d={`M${x-s*0.05},${y-s*0.22} C${x-s*0.15},${y-s*0.28} ${x-s*0.2},${y-s*0.22} ${x-s*0.18},${y-s*0.18}`}
            stroke="#1a7a30" strokeWidth={s*0.02} fill="none" />
          <path d={`M${x-s*0.05},${y-s*0.22} C${x+s*0.02},${y-s*0.3} ${x+s*0.08},${y-s*0.26} ${x+s*0.06},${y-s*0.2}`}
            stroke="#228B22" strokeWidth={s*0.02} fill="none" />
          <path d={`M${x-s*0.05},${y-s*0.22} C${x-s*0.08},${y-s*0.32} ${x-s*0.04},${y-s*0.34} ${x+s*0.02},${y-s*0.28}`}
            stroke="#1E8B2E" strokeWidth={s*0.018} fill="none" />
          <path d={`M${x-s*0.05},${y-s*0.22} C${x-s*0.12},${y-s*0.2} ${x-s*0.15},${y-s*0.15} ${x-s*0.12},${y-s*0.12}`}
            stroke="#2E9B3E" strokeWidth={s*0.015} fill="none" />
          {/* Coconuts */}
          <circle cx={x-s*0.05} cy={y-s*0.21} r={s*0.015} fill="#5a3a1a" />
          <circle cx={x-s*0.04} cy={y-s*0.2} r={s*0.012} fill="#6a4a2a" />
        </g>
      )}
      {progress > 0.35 && (
        <g>
          <path d={`M${x+s*0.12},${y+s*0.06} C${x+s*0.13},${y-s*0.02} ${x+s*0.11},${y-s*0.1} ${x+s*0.09},${y-s*0.16}`}
            stroke="#5B3516" strokeWidth={s*0.025} fill="none" strokeLinecap="round" />
          <path d={`M${x+s*0.09},${y-s*0.16} C${x+s*0.16},${y-s*0.22} ${x+s*0.2},${y-s*0.18} ${x+s*0.18},${y-s*0.14}`}
            stroke="#228B22" strokeWidth={s*0.018} fill="none" />
          <path d={`M${x+s*0.09},${y-s*0.16} C${x+s*0.04},${y-s*0.22} ${x+s*0.02},${y-s*0.2} ${x+s*0.04},${y-s*0.15}`}
            stroke="#1a7a30" strokeWidth={s*0.016} fill="none" />
          <path d={`M${x+s*0.09},${y-s*0.16} C${x+s*0.1},${y-s*0.24} ${x+s*0.14},${y-s*0.24} ${x+s*0.13},${y-s*0.18}`}
            stroke="#2E8B2E" strokeWidth={s*0.015} fill="none" />
        </g>
      )}
      {progress > 0.6 && (
        <g>
          <path d={`M${x+s*0.02},${y} C${x},${y-s*0.1} ${x+s*0.01},${y-s*0.2} ${x+s*0.03},${y-s*0.28}`}
            stroke="#6B4226" strokeWidth={s*0.028} fill="none" strokeLinecap="round" />
          <path d={`M${x+s*0.03},${y-s*0.28} C${x+s*0.12},${y-s*0.34} ${x+s*0.16},${y-s*0.3} ${x+s*0.12},${y-s*0.24}`}
            stroke="#1E7B1E" strokeWidth={s*0.02} fill="none" />
          <path d={`M${x+s*0.03},${y-s*0.28} C${x-s*0.06},${y-s*0.34} ${x-s*0.1},${y-s*0.3} ${x-s*0.06},${y-s*0.24}`}
            stroke="#228B22" strokeWidth={s*0.018} fill="none" />
          <path d={`M${x+s*0.03},${y-s*0.28} C${x+s*0.04},${y-s*0.36} ${x+s*0.08},${y-s*0.36} ${x+s*0.06},${y-s*0.3}`}
            stroke="#2E8B2E" strokeWidth={s*0.016} fill="none" />
          <circle cx={x+s*0.03} cy={y-s*0.27} r={s*0.013} fill="#5a3a1a" />
        </g>
      )}

      {/* Small bushes/shrubs on less-progressed islands */}
      {progress > 0 && progress < 0.35 && (
        <>
          <ellipse cx={x+s*0.08} cy={y-s*0.05} rx={s*0.04} ry={s*0.03} fill="#5aaa6a" opacity="0.6" />
          <ellipse cx={x-s*0.1} cy={y+s*0.02} rx={s*0.035} ry={s*0.025} fill="#4a9a5a" opacity="0.5" />
        </>
      )}

      {/* Waves lapping at shore */}
      <path d={`M${x-s*0.4},${y+s*0.15} q${s*0.06},-${s*0.03} ${s*0.12},0`}
        fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1">
        <animate attributeName="opacity" values="0.1;0.05;0.1" dur="4s" repeatCount="indefinite" />
      </path>

      {/* Status flag */}
      <line x1={x+s*0.28} y1={y-s*0.06} x2={x+s*0.28} y2={y-s*0.24} stroke="#4a4a4a" strokeWidth="1.5" />
      <polygon
        points={`${x+s*0.28},${y-s*0.24} ${x+s*0.38},${y-s*0.2} ${x+s*0.28},${y-s*0.16}`}
        fill={isDone ? '#22c55e' : isActive ? '#fd4987' : project.columnName === 'To Do' ? '#6130ba' : '#6b7280'}
      />

      {/* Done checkmark */}
      {isDone && <text x={x} y={y+s*0.05} textAnchor="middle" fontSize={s*0.18}>✅</text>}

      {/* Priority badge */}
      {(project.priority === 'urgent' || project.priority === 'high') && (
        <g>
          <circle cx={x-s*0.32} cy={y-s*0.22} r={s*0.055}
            fill={project.priority === 'urgent' ? '#ef4444' : '#f97316'} />
          <text x={x-s*0.32} y={y-s*0.195} textAnchor="middle" fontSize={s*0.055} fill="white" fontWeight="bold">
            {project.priority === 'urgent' ? '!' : '↑'}
          </text>
        </g>
      )}

      {/* ─── BOAT parked at island (2x size) ─── */}
      {hasBoat && (
        <g>
          {/* Subtle pulse glow under boat */}
          <ellipse cx={x-s*0.42} cy={y+s*0.18} rx="22" ry="8" fill="none"
            stroke="rgba(253,73,135,0.25)" strokeWidth="1.5">
            <animate attributeName="rx" values="18;26;18" dur="3.5s" repeatCount="indefinite" />
            <animate attributeName="ry" values="6;10;6" dur="3.5s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.3;0.08;0.3" dur="3.5s" repeatCount="indefinite" />
          </ellipse>
          {/* Boat hull — bigger */}
          <path d={`M${x-s*0.56},${y+s*0.16} Q${x-s*0.58},${y+s*0.24} ${x-s*0.42},${y+s*0.26} Q${x-s*0.26},${y+s*0.24} ${x-s*0.28},${y+s*0.16} Z`}
            fill="#8B4513" />
          <path d={`M${x-s*0.54},${y+s*0.16} L${x-s*0.3},${y+s*0.16} L${x-s*0.32},${y+s*0.11} L${x-s*0.52},${y+s*0.11} Z`}
            fill="#A0522D" />
          {/* Deck detail */}
          <line x1={x-s*0.5} y1={y+s*0.14} x2={x-s*0.34} y2={y+s*0.14} stroke="#6B4226" strokeWidth="0.8" opacity="0.4" />
          {/* Mast & sail — taller */}
          <line x1={x-s*0.42} y1={y+s*0.11} x2={x-s*0.42} y2={y-s*0.08} stroke="#5a3a1a" strokeWidth="2" />
          <path d={`M${x-s*0.42},${y-s*0.08} Q${x-s*0.32},${y} ${x-s*0.38},${y+s*0.08} L${x-s*0.42},${y+s*0.08} Z`}
            fill="white" opacity="0.9" />
          {/* Small flag at top of mast */}
          <polygon points={`${x-s*0.42},${y-s*0.08} ${x-s*0.37},${y-s*0.06} ${x-s*0.42},${y-s*0.04}`}
            fill="#fd4987" />
          {/* Miles on the boat */}
          <text x={x-s*0.43} y={y+s*0.1} fontSize="14" textAnchor="middle">🤖</text>
          {/* Water ripples */}
          <ellipse cx={x-s*0.42} cy={y+s*0.28} rx="18" ry="4"
            fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.8">
            <animate attributeName="rx" values="14;22;14" dur="4s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.1;0.03;0.1" dur="4s" repeatCount="indefinite" />
          </ellipse>
          {/* Gentle bob */}
          <animateTransform attributeName="transform" type="translate"
            values="0,0; 0,-2; 0,0; 0,1.5; 0,0" dur="5s" repeatCount="indefinite" />
        </g>
      )}

      {/* ─── Label: full text, multi-line if needed ─── */}
      {(() => {
        const title = project.title
        const maxLineLen = 28
        const lines: string[] = []
        if (title.length <= maxLineLen) {
          lines.push(title)
        } else {
          // Word-wrap
          const words = title.split(' ')
          let cur = ''
          for (const w of words) {
            if (cur && (cur + ' ' + w).length > maxLineLen) {
              lines.push(cur)
              cur = w
            } else {
              cur = cur ? cur + ' ' + w : w
            }
          }
          if (cur) lines.push(cur)
        }

        const fontSize = Math.max(9, Math.min(11, s * 0.1))
        const lineH = fontSize + 2
        const bgH = lines.length * lineH + 6
        const bgW = Math.max(...lines.map(l => l.length)) * fontSize * 0.58 + 16
        const labelY = y + s * 0.36

        return (
          <g>
            <rect x={x - bgW/2} y={labelY} width={bgW} height={bgH}
              rx="4" fill="rgba(0,0,0,0.7)" />
            {lines.map((line, i) => (
              <text key={i} x={x} y={labelY + 11 + i * lineH}
                textAnchor="middle" fill="white" fontSize={fontSize} fontWeight="600"
                style={{ textShadow: '0 1px 3px rgba(0,0,0,1)' }}>
                {line}
              </text>
            ))}
          </g>
        )
      })()}

      {/* Progress bar under label */}
      {totalTasks > 0 && (
        <g>
          {(() => {
            const title = project.title
            const maxLineLen = 28
            const lineCount = title.length <= maxLineLen ? 1 : Math.ceil(title.split(' ').reduce((acc: string[], w: string) => {
              const last = acc[acc.length - 1]
              if (last && (last + ' ' + w).length > maxLineLen) { acc.push(w) } else { acc[acc.length - 1] = last ? last + ' ' + w : w }
              return acc
            }, ['']).length)
            const fontSize = Math.max(9, Math.min(11, s * 0.1))
            const lineH = fontSize + 2
            const barY = y + s * 0.36 + lineCount * lineH + 10
            return (
              <>
                <rect x={x - s*0.25} y={barY} width={s*0.5} height={3} rx="1.5" fill="rgba(255,255,255,0.15)" />
                <rect x={x - s*0.25} y={barY} width={s*0.5 * progress} height={3} rx="1.5"
                  fill={progress > 0.7 ? '#22c55e' : progress > 0.3 ? '#eab308' : '#6b7280'} />
                <text x={x} y={barY + 12} textAnchor="middle" fill="#64748b" fontSize="8">
                  {completedTasks}/{totalTasks}
                </text>
              </>
            )
          })()}
        </g>
      )}

    </g>
  )
}

/* ─── Cloud decoration ─── */
function Cloud({ x, y, scale, dur }: { x: number; y: number; scale: number; dur: number }) {
  return (
    <g opacity="0.1">
      <ellipse cx="0" cy="0" rx="28" ry="10" fill="white" />
      <ellipse cx="-14" cy="-5" rx="16" ry="9" fill="white" />
      <ellipse cx="13" cy="-4" rx="20" ry="10" fill="white" />
      <ellipse cx="4" cy="-8" rx="14" ry="8" fill="white" />
      <animateTransform attributeName="transform" type="translate"
        from={`${x} ${y}`} to={`${x + 80} ${y}`}
        dur={`${dur}s`} repeatCount="indefinite" />
      <animateTransform attributeName="transform" type="scale"
        values={`${scale};${scale}`} dur="1s" additive="sum" />
    </g>
  )
}

/* ─── Seagull ─── */
function Seagull({ x, y }: { x: number; y: number }) {
  return (
    <g opacity="0.2">
      <path d={`M${x-6},${y} Q${x-3},${y-4} ${x},${y-1} Q${x+3},${y-4} ${x+6},${y}`}
        fill="none" stroke="white" strokeWidth="1" />
      <animateTransform attributeName="transform" type="translate"
        values="0,0; 30,-5; 60,0; 90,-3; 120,2" dur="20s" repeatCount="indefinite" />
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

  // Active project Miles is working on
  const activeProject = useMemo(() =>
    allProjects.find(p => p.columnName === 'In Progress' && p.assignee === 'miles') ||
    allProjects.find(p => p.columnName === 'In Progress')
  , [allProjects])

  // Layout: fit all islands in viewport
  const layout = useMemo(() => {
    const count = allProjects.length
    if (count === 0) return { positions: [], viewW: 800, viewH: 500 }

    const cols = count <= 4 ? 2 : count <= 6 ? 3 : count <= 9 ? 3 : 4
    const rows = Math.ceil(count / cols)

    const cellW = 210
    const cellH = 190
    const padX = 90
    const padY = 55
    const viewW = cols * cellW + padX * 2
    const viewH = rows * cellH + padY * 2

    const positions = allProjects.map((p, i) => {
      const col = i % cols
      const row = Math.floor(i / cols)
      const hash = p.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
      const jX = ((hash * 13) % 24) - 12
      const jY = ((hash * 17) % 16) - 8
      const x = padX + col * cellW + cellW / 2 + jX
      const y = padY + row * cellH + cellH / 2 + jY
      const isActiveItem = p.columnName === 'In Progress'
      const size = isActiveItem ? 82 : p.columnName === 'Backlog' ? 58 : 70
      return { x, y, size, project: p }
    })

    return { positions, viewW, viewH }
  }, [allProjects])

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

      {/* Ocean viewport */}
      <div className="flex-1 relative" style={{ overflow: 'hidden' }}>
        {/* Background */}
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse at 50% 25%, #0e2d50 0%, #091c35 45%, #071422 100%)',
        }} />

        {/* Animated waves */}
        <div className="absolute inset-0 opacity-[0.05]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='120' height='20' viewBox='0 0 120 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 10 Q15 0 30 10 Q45 20 60 10 Q75 0 90 10 Q105 20 120 10' fill='none' stroke='%234a90d9' stroke-width='1.5'/%3E%3C/svg%3E")`,
          backgroundSize: '120px 20px',
          animation: 'waveScroll 10s linear infinite',
        }} />

        {/* Activity banner */}
        {activeProject && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-black/60 backdrop-blur-md rounded-full px-5 py-2 border border-pink-500/30 flex items-center gap-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-pink-500"></span>
            </span>
            <span className="text-sm text-gray-300">
              <span className="text-white font-semibold">⚡ Miles</span> docked at{' '}
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

        {/* Agent card */}
        <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm rounded-xl p-3 text-xs text-gray-400 z-10 border border-white/5">
          <div className="text-white font-semibold mb-1">🤖 Miles — Agent</div>
          <div>{activeProject ? `Docked at: ${activeProject.title}` : 'Idle — no active project'}</div>
        </div>

        {/* SVG Map */}
        <svg
          viewBox={`0 0 ${layout.viewW} ${layout.viewH}`}
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <radialGradient id="waterGlow" cx="50%" cy="35%">
              <stop offset="0%" stopColor="#1a4a6e" stopOpacity="0.25" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>

          <rect x="0" y="0" width={layout.viewW} height={layout.viewH} fill="url(#waterGlow)" />

          {/* Clouds */}
          <Cloud x={60} y={25} scale={0.7} dur={35} />
          <Cloud x={layout.viewW - 180} y={40} scale={0.55} dur={42} />
          <Cloud x={layout.viewW / 2 - 30} y={15} scale={0.45} dur={38} />

          {/* Seagulls */}
          <Seagull x={150} y={45} />
          <Seagull x={layout.viewW - 100} y={60} />

          {/* Subtle wave lines */}
          {[...Array(4)].map((_, i) => (
            <path key={i}
              d={`M${20 + i * layout.viewW / 4},${layout.viewH * 0.25 + i * 50} q25,-6 50,0 q25,6 50,0`}
              fill="none" stroke="rgba(74,144,217,0.06)" strokeWidth="1" />
          ))}

          {/* Islands */}
          {layout.positions.map(({ x, y, size, project }) => (
            <Island
              key={project.id}
              project={project}
              x={x} y={y} size={size}
              onClick={setSelectedProject}
              isSelected={selectedProject?.id === project.id}
              hasBoat={activeProject?.id === project.id}
            />
          ))}
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
