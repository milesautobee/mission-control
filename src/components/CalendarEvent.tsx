type CalendarEventItem = {
  id: string
  type: 'cron' | 'due_date'
  title: string
  date: string
  time?: string | null
  recurrence?: string | null
  priority?: string | null
  status?: 'active' | 'disabled'
}

const TYPE_STYLES = {
  cron: {
    badge: 'bg-pink-500/20 text-pink-200',
    border: 'border-pink-500/40',
    gradient: 'from-pink-500/25 to-transparent',
  },
  due_date: {
    badge: 'bg-purple-500/20 text-purple-200',
    border: 'border-purple-500/40',
    gradient: 'from-purple-500/25 to-transparent',
  },
}

const PRIORITY_LABELS: Record<string, string> = {
  urgent: 'Urgent',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

export function CalendarEvent({ event }: { event: CalendarEventItem }) {
  const styles = TYPE_STYLES[event.type]
  const disabled = event.status === 'disabled'

  return (
    <div
      className={`rounded-xl border bg-gradient-to-br px-3 py-2 backdrop-blur-xl shadow-lg transition ${styles.border} ${styles.gradient} ${
        disabled ? 'opacity-50 line-through' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-gray-300">
          {event.time ? event.time : 'All day'}
        </span>
        <span
          className={`text-[10px] uppercase tracking-wide rounded-full px-2 py-0.5 ${styles.badge}`}
        >
          {event.type === 'cron' ? 'Cron' : 'Due'}
        </span>
      </div>
      <div className="mt-2 text-sm text-white font-medium leading-snug">
        {event.title}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-gray-300">
        {event.recurrence && (
          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5">
            {event.recurrence}
          </span>
        )}
        {event.priority && (
          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5">
            {PRIORITY_LABELS[event.priority] ?? event.priority}
          </span>
        )}
        {disabled && <span className="text-gray-400">Disabled</span>}
      </div>
    </div>
  )
}

export type { CalendarEventItem }
