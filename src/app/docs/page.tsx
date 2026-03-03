'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { ThemeToggle } from '@/components/ThemeToggle'
import { ViewToggle } from '@/components/ViewToggle'

type DocCategory = 'all' | 'prd' | 'newsletter' | 'script' | 'plan' | 'research' | 'general'

type DocumentEntry = {
  id: string
  title: string
  content: string
  category: string
  format: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

const CATEGORY_TABS: Array<{ label: string; value: DocCategory }> = [
  { label: 'All', value: 'all' },
  { label: 'PRD', value: 'prd' },
  { label: 'Newsletter', value: 'newsletter' },
  { label: 'Script', value: 'script' },
  { label: 'Plan', value: 'plan' },
  { label: 'Research', value: 'research' },
  { label: 'General', value: 'general' },
]

function formatDocDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  }).format(date)
}

function getCategoryLabel(category: string) {
  const normalized = category.trim().toLowerCase()
  const match = CATEGORY_TABS.find(tab => tab.value === normalized)
  if (match) return match.label
  if (!normalized) return 'General'
  return normalized.charAt(0).toUpperCase() + normalized.slice(1)
}

export default function DocsPage() {
  const [docs, setDocs] = useState<DocumentEntry[]>([])
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<DocCategory>('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const [isNewDocOpen, setIsNewDocOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newDocTitle, setNewDocTitle] = useState('')
  const [newDocCategory, setNewDocCategory] = useState<Exclude<DocCategory, 'all'>>('general')
  const [newDocContent, setNewDocContent] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    const timer = setTimeout(async () => {
      try {
        setLoading(true)
        setError(null)

        const params = new URLSearchParams()
        const trimmedSearch = search.trim()
        if (trimmedSearch) params.set('search', trimmedSearch)
        if (activeCategory !== 'all') params.set('category', activeCategory)

        const route = params.size ? `/api/docs?${params.toString()}` : '/api/docs'
        const res = await fetch(route, { signal: controller.signal, cache: 'no-store' })
        if (!res.ok) {
          throw new Error('Failed to fetch documents')
        }

        const data: unknown = await res.json()
        setDocs(Array.isArray(data) ? (data as DocumentEntry[]) : [])
      } catch (fetchError) {
        if ((fetchError as { name?: string }).name === 'AbortError') return
        setError('Documents are unavailable right now.')
      } finally {
        setLoading(false)
      }
    }, 200)

    return () => {
      controller.abort()
      clearTimeout(timer)
    }
  }, [search, activeCategory, refreshKey])

  useEffect(() => {
    if (docs.length === 0) {
      setSelectedDocId(null)
      return
    }

    const exists = docs.some(doc => doc.id === selectedDocId)
    if (!selectedDocId || !exists) {
      setSelectedDocId(docs[0].id)
    }
  }, [docs, selectedDocId])

  const selectedDoc = useMemo(
    () => docs.find(doc => doc.id === selectedDocId) ?? null,
    [docs, selectedDocId]
  )

  async function handleCreateDoc(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const title = newDocTitle.trim()
    if (!title || !newDocContent.trim()) {
      setError('Title and content are required.')
      return
    }

    try {
      setCreating(true)
      setError(null)

      const res = await fetch('/api/docs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          category: newDocCategory,
          content: newDocContent,
          format: 'md',
          tags: [],
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to create document')
      }

      const createdDoc = (await res.json()) as DocumentEntry

      const normalizedSearch = search.trim().toLowerCase()
      const matchesSearch =
        !normalizedSearch ||
        createdDoc.title.toLowerCase().includes(normalizedSearch) ||
        createdDoc.content.toLowerCase().includes(normalizedSearch)
      const matchesCategory =
        activeCategory === 'all' || createdDoc.category.toLowerCase() === activeCategory

      if (matchesSearch && matchesCategory) {
        setDocs(previous => [createdDoc, ...previous.filter(doc => doc.id !== createdDoc.id)])
        setSelectedDocId(createdDoc.id)
      } else {
        setRefreshKey(previous => previous + 1)
      }

      setNewDocTitle('')
      setNewDocCategory('general')
      setNewDocContent('')
      setIsNewDocOpen(false)
    } catch (createError) {
      console.error('Failed to create document:', createError)
      setError('Failed to create document.')
    } finally {
      setCreating(false)
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
              <ViewToggle active="docs" />

              <ThemeToggle />

              <div className="hidden md:flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2 text-gray-400">
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                  <span>Docs</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-3xl font-semibold text-white">Documents</h2>
              <p className="text-sm text-gray-400 mt-1">
                Store PRDs, scripts, plans, and research in one place.
              </p>
            </div>

            <button
              onClick={() => setIsNewDocOpen(true)}
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-pink-500/90 hover:bg-pink-500 text-white text-sm font-medium transition-colors"
            >
              New Doc
            </button>
          </div>

          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {CATEGORY_TABS.map(tab => (
                <button
                  key={tab.value}
                  onClick={() => setActiveCategory(tab.value)}
                  className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                    activeCategory === tab.value
                      ? 'bg-white/10 text-white border-white/20'
                      : 'text-gray-400 border-white/10 hover:text-white hover:border-white/20'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Search documents..."
              className="w-full xl:w-80 px-3 py-2 rounded-lg border border-white/10 bg-black/30 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50"
            />
          </div>

          {error && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-red-200">
              {error}
            </div>
          )}

          {loading && (
            <div className="rounded-2xl border border-white/10 bg-black/20 p-10 flex items-center justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-pink-500"></div>
            </div>
          )}

          {!loading && !error && docs.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-black/20 p-10 text-center">
              <p className="text-white font-medium">No documents found.</p>
              <p className="text-sm text-gray-400 mt-2">
                Create your first document to get started.
              </p>
            </div>
          )}

          {!loading && !error && docs.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-[340px_minmax(0,1fr)] gap-6">
              <aside className="rounded-2xl border border-white/10 bg-black/20 overflow-hidden">
                <div className="max-h-[68vh] overflow-y-auto">
                  {docs.map(doc => {
                    const isSelected = doc.id === selectedDocId
                    return (
                      <button
                        key={doc.id}
                        onClick={() => setSelectedDocId(doc.id)}
                        className={`w-full text-left p-4 border-b border-white/5 transition-colors ${
                          isSelected ? 'bg-pink-500/15' : 'hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-medium text-white line-clamp-2">{doc.title}</p>
                          <span className="text-[10px] uppercase tracking-wide text-pink-200 border border-pink-400/30 bg-pink-500/10 rounded-full px-2 py-0.5">
                            {getCategoryLabel(doc.category)}
                          </span>
                        </div>
                        <p className="mt-2 text-xs text-gray-400">{formatDocDate(doc.updatedAt)}</p>
                      </button>
                    )
                  })}
                </div>
              </aside>

              <section className="rounded-2xl border border-white/10 bg-black/20 p-5 flex flex-col min-h-[68vh]">
                {selectedDoc ? (
                  <>
                    <div className="mb-4 border-b border-white/10 pb-3 flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-lg text-white font-semibold">{selectedDoc.title}</h3>
                        <p className="text-xs text-gray-400 mt-1">
                          Updated {formatDocDate(selectedDoc.updatedAt)}
                        </p>
                      </div>
                      <span className="text-[11px] uppercase tracking-wide text-pink-200 border border-pink-400/30 bg-pink-500/10 rounded-full px-2 py-1">
                        {getCategoryLabel(selectedDoc.category)}
                      </span>
                    </div>

                    <pre className="flex-1 overflow-auto rounded-xl border border-white/10 bg-black/40 p-4 text-sm text-gray-200 leading-6 whitespace-pre-wrap">
                      <code>{selectedDoc.content}</code>
                    </pre>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-sm text-gray-400">
                    Select a document to view its contents.
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      </section>

      {isNewDocOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm p-4 flex items-center justify-center">
          <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-gray-950/95 shadow-2xl">
            <form onSubmit={handleCreateDoc} className="p-6 flex flex-col gap-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">New Document</h3>
                  <p className="text-sm text-gray-400 mt-1">
                    Add a document to your mission control knowledge base.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsNewDocOpen(false)}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Close
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_180px] gap-3">
                <input
                  value={newDocTitle}
                  onChange={event => setNewDocTitle(event.target.value)}
                  placeholder="Document title"
                  className="px-3 py-2 rounded-lg border border-white/10 bg-black/30 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                />
                <select
                  value={newDocCategory}
                  onChange={event =>
                    setNewDocCategory(event.target.value as Exclude<DocCategory, 'all'>)
                  }
                  className="px-3 py-2 rounded-lg border border-white/10 bg-black/30 text-sm text-white focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                >
                  {CATEGORY_TABS.filter(tab => tab.value !== 'all').map(tab => (
                    <option key={tab.value} value={tab.value}>
                      {tab.label}
                    </option>
                  ))}
                </select>
              </div>

              <textarea
                value={newDocContent}
                onChange={event => setNewDocContent(event.target.value)}
                placeholder="Write your document content..."
                rows={14}
                className="w-full px-3 py-2 rounded-lg border border-white/10 bg-black/30 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50 resize-y"
              />

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewDocOpen(false)}
                  className="px-4 py-2 rounded-lg border border-white/10 text-sm text-gray-300 hover:text-white hover:border-white/20 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 rounded-lg bg-pink-500/90 hover:bg-pink-500 disabled:opacity-70 disabled:cursor-not-allowed text-sm text-white font-medium transition-colors"
                >
                  {creating ? 'Creating...' : 'Create Doc'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}
