# Mission Control v2 - Feature Plan

**Date:** 2026-02-06
**Requested by:** Blake
**Planned by:** Miles

---

## Overview

Three new features for Mission Control:
1. **Activity Feed** - Log every action Miles takes
2. **Calendar View** - Weekly view of scheduled tasks/cron jobs
3. **Global Search** - Search across memory, documents, and tasks

## Current Architecture

- **Framework:** Next.js 14.2.35
- **Database:** Railway Postgres (Prisma ORM)
- **Styling:** Tailwind CSS with glassmorphism (dark theme, pink/purple gradients)
- **Drag-drop:** dnd-kit
- **Deployed:** Vercel at https://mission-control-flax.vercel.app

## Database Decision

**Recommendation: Continue with Railway Postgres**

Reasons:
- Already set up and working
- Prisma migrations are simple
- No additional costs/complexity
- Team is familiar with it
- Can add tables easily

Alternatives considered but rejected:
- Convex - overkill, adds vendor dependency
- Neon - no advantage over existing Railway setup
- Supabase - already have Postgres, would be redundant

---

## Feature 1: Activity Feed

### Purpose
Track every action Miles performs for Blake's visibility. Think: audit log + timeline.

### Data Model

```prisma
model Activity {
  id          String   @id @default(cuid())
  timestamp   DateTime @default(now())
  action      String   // "file_created", "message_sent", "task_completed", etc.
  category    String   // "files", "messaging", "cron", "tasks", "browser", "search"
  title       String   // Human-readable summary
  description String?  // Optional longer description
  metadata    Json?    // Flexible JSON for action-specific data
  sessionId   String?  // OpenClaw session ID if available
  status      String   @default("success") // "success", "error", "pending"
  
  @@map("activities")
  @@index([timestamp])
  @@index([category])
  @@index([action])
}
```

### Action Categories

| Category | Actions |
|----------|---------|
| files | file_created, file_edited, file_deleted, file_read |
| messaging | message_sent, message_received |
| cron | cron_created, cron_triggered, cron_updated, cron_deleted |
| tasks | task_created, task_completed, task_moved, task_deleted |
| browser | page_visited, screenshot_taken |
| search | web_search, memory_search |
| system | session_started, heartbeat, error |
| external | api_call, webhook_received |

### API Endpoints

```
POST /api/activity - Log new activity (Miles calls this)
GET /api/activity - List activities (with filters)
  ?limit=50
  ?category=files
  ?since=2026-02-01
  ?action=file_created
```

### UI Component

**Tab: "Activity"** in nav bar

Features:
- Real-time feed (newest first)
- Category filters (pills/chips)
- Date range picker
- Search within feed
- Click to expand details
- Color-coded by category
- Timestamps (relative: "2 hours ago")

Design:
- Timeline style (vertical line connecting entries)
- Icons per category
- Glassmorphism cards
- Pink accent for important items

### Integration Points

Miles will call `POST /api/activity` after completing actions. Example payload:

```json
{
  "action": "file_created",
  "category": "files",
  "title": "Created FEATURE-PLAN.md",
  "description": "Wrote feature plan for Mission Control v2",
  "metadata": {
    "path": "/mission-control/FEATURE-PLAN.md",
    "bytes": 4521
  }
}
```

---

## Feature 2: Calendar View

### Purpose
Visualize scheduled tasks and cron jobs in a weekly calendar format.

### Data Sources

1. **OpenClaw Cron Jobs** - via `/api/cron` (already exists)
2. **Project Due Dates** - from existing Prisma `Project.dueDate`
3. **Future: Google Calendar** - could integrate later

### No New Database Tables Needed

We'll pull from:
- Cron API to get scheduled jobs
- Existing Project table for due dates

### API Endpoints

```
GET /api/calendar - Aggregate calendar events
  ?weekOf=2026-02-03  // Start of week
  
Response:
{
  "events": [
    {
      "id": "cron-27fdcc7e",
      "type": "cron",
      "title": "Sync Kierra TikTok Videos",
      "time": "04:00",
      "recurrence": "daily",
      "color": "#fd4987"
    },
    {
      "id": "proj-abc123",
      "type": "due_date",
      "title": "Homepage v46-7 Review",
      "date": "2026-02-08",
      "priority": "high",
      "color": "#6130ba"
    }
  ]
}
```

### UI Component

**Tab: "Calendar"** in nav bar

Layout:
- Weekly view (7 columns: Sun-Sat)
- Hour rows (or just AM/PM sections for simplicity)
- Event cards positioned by time
- Color-coded by type (cron = pink, due date = purple, reminder = green)
- Week navigation (← prev / today / next →)
- Click event to see details

Features:
- Current day highlighted
- Current time indicator line
- Mini-calendar for quick navigation
- Toggle show/hide by type

Design notes:
- Same glassmorphism style
- Subtle grid lines
- Events have rounded corners, slight shadow
- Today column has subtle glow

### Cron Visualization

For recurring cron jobs:
- Show on each applicable day
- Display next 3 occurrences clearly
- Disabled jobs shown with strikethrough/dimmed

---

## Feature 3: Global Search

### Purpose
Search across the entire workspace - memory files, documents, tasks, and activities.

### Search Domains

| Domain | Source | Method |
|--------|--------|--------|
| Memory | MEMORY.md, memory/*.md | Full-text search |
| Documents | Workspace .md files | Full-text search |
| Tasks | Prisma Project + Task | Database query |
| Activities | Prisma Activity | Database query |
| Cron | Cron API | API call |

### Search Index Strategy

Option A: **Simple grep-style** (MVP)
- For files: `grep -r` equivalent via Node.js
- For DB: Prisma `contains` queries
- Fast to implement, works for our scale

Option B: **Postgres Full-Text Search** (Better)
- Create `tsvector` columns for searchable content
- Index documents in a search table
- Better relevance ranking

**Recommendation: Start with Option A, migrate to B if needed.**

### Data Model (for Option B later)

```prisma
model SearchIndex {
  id        String   @id @default(cuid())
  source    String   // "memory", "document", "task", "activity"
  sourceId  String   // Original record ID or file path
  title     String
  content   String   // Full text content
  metadata  Json?
  updatedAt DateTime @updatedAt
  
  // Postgres full-text search column
  searchVector Unsupported("tsvector")?
  
  @@map("search_index")
  @@index([source])
}
```

### API Endpoints

```
GET /api/search?q=kierra+voice
  &domains=memory,tasks,activities  // Optional filter
  &limit=20

Response:
{
  "query": "kierra voice",
  "results": [
    {
      "type": "memory",
      "title": "KIERRA.md",
      "snippet": "...The Core Tension: Leader + Fellow Traveler. Kierra balances being an authority (has real expertise) with being a fellow...",
      "path": "/workspace/KIERRA.md",
      "line": 45,
      "score": 0.95
    },
    {
      "type": "task",
      "title": "Voice Corpus Expansion",
      "snippet": "Pull TikTok transcripts and analyze for verified phrases",
      "id": "proj-xyz123",
      "score": 0.82
    }
  ],
  "counts": {
    "memory": 3,
    "documents": 5,
    "tasks": 1,
    "activities": 2
  }
}
```

### UI Component

**Global search bar** in header (always visible) + **Tab: "Search"** for advanced

Header search:
- Command+K shortcut
- Quick results dropdown
- "See all results" link

Search tab features:
- Full results page
- Domain filters (checkboxes)
- Date range filter
- Sort by relevance/date
- Highlight matching terms
- Preview pane (click result to see more)

Design:
- Search bar: subtle glassmorphism, pink focus ring
- Results: card per result, icons by type
- Snippets with `<mark>` highlighted terms

---

## Navigation Structure

Current:
```
[M] Mission Control | Board | List | [theme] | [status]
```

Proposed:
```
[M] Mission Control | Board | Calendar | Activity | [🔍] | [theme]
```

- Board = Kanban (existing)
- Calendar = New weekly view
- Activity = New feed
- 🔍 = Global search (opens modal or dedicated page)
- List view moves to dropdown or removed (rarely used)

---

## Implementation Order

### Phase 1: Activity Feed (Day 1)
1. Prisma schema + migration
2. API routes (POST, GET)
3. Activity list component
4. Navigation tab
5. Miles integration (start logging)

### Phase 2: Calendar View (Day 2)
1. Calendar API endpoint
2. Weekly calendar component
3. Event cards
4. Navigation integration
5. Cron job visualization

### Phase 3: Global Search (Day 3)
1. Search API (simple grep-style first)
2. Search bar component
3. Results page
4. Keyboard shortcuts
5. Domain filters

### Phase 4: Polish
1. Loading states
2. Error handling
3. Mobile responsiveness
4. Performance optimization
5. Documentation

---

## Technical Notes

### File Structure (new files)

```
src/
├── app/
│   ├── activity/
│   │   └── page.tsx          # Activity feed page
│   ├── calendar/
│   │   └── page.tsx          # Calendar view page
│   ├── search/
│   │   └── page.tsx          # Search results page
│   └── api/
│       ├── activity/
│       │   └── route.ts      # Activity CRUD
│       ├── calendar/
│       │   └── route.ts      # Calendar aggregation
│       └── search/
│           └── route.ts      # Global search
├── components/
│   ├── ActivityFeed.tsx
│   ├── ActivityItem.tsx
│   ├── WeeklyCalendar.tsx
│   ├── CalendarEvent.tsx
│   ├── SearchBar.tsx
│   └── SearchResults.tsx
└── lib/
    ├── search.ts             # Search utilities
    └── calendar.ts           # Calendar utilities
```

### Environment Variables

No new env vars needed - using existing:
- `DATABASE_URL` - Railway Postgres

### Dependencies to Add

```json
{
  "date-fns": "^4.1.0",  // Already have
  "fuse.js": "^7.0.0"    // Optional: client-side fuzzy search
}
```

---

## Open Questions

1. **Activity retention** - How long to keep activity logs? (Suggest: 90 days)
2. **Real-time updates** - Use polling or WebSocket? (Suggest: polling every 30s for MVP)
3. **Search indexing** - When to build full-text index? (Suggest: post-MVP if needed)

---

## Success Criteria

1. ✅ Blake can see a timeline of everything Miles has done
2. ✅ Blake can see upcoming scheduled tasks/reminders in a weekly view
3. ✅ Blake can search for any term and find relevant results across the workspace
4. ✅ All features match existing Fast Track branding (glassmorphism, pink/purple)
5. ✅ Mobile-friendly (responsive design)

---

*Plan ready for implementation. Spawning Codex to build.*
