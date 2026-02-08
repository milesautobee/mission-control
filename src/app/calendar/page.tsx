import { ThemeToggle } from '@/components/ThemeToggle'
import { ViewToggle } from "@/components/ViewToggle"
import { WeeklyCalendar } from '@/components/WeeklyCalendar'

export default function CalendarPage() {
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
              <ViewToggle active="calendar" />

              <ThemeToggle />

              <div className="hidden md:flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2 text-gray-400">
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                  <span>Schedule</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <WeeklyCalendar />
    </main>
  )
}
