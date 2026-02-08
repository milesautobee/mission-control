import { ActivityFeed } from '@/components/ActivityFeed'
import { SearchBar } from '@/components/SearchBar'
import { ViewToggle } from '@/components/ViewToggle'
//  from '@/components/SearchBar'
import { ThemeToggle } from '@/components/ThemeToggle'

export default function ActivityPage() {
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
              <ViewToggle active="activity" />

              <SearchBar />
              <ThemeToggle />

              <div className="hidden md:flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2 text-gray-400">
                  <span className="w-2 h-2 rounded-full bg-pink-500"></span>
                  <span>Logging</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <ActivityFeed />
    </main>
  )
}
