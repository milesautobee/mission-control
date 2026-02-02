# Mission Control - Planning Document

## Overview
A Kanban-style task management board for Fast Track operations. Shared between Blake (human) and Miles (AI assistant) to track tasks, projects, and progress.

## Tech Stack Decisions

### Frontend: Next.js 14 (App Router)
- **Why:** Matches TESS stack, modern React features, great DX, API routes built-in
- Server components for initial load, client components for interactivity

### Drag-and-Drop: dnd-kit
- **Why chosen over alternatives:**
  - `@hello-pangea/dnd` - Good but heavier, less flexible
  - `react-dnd` - Too low-level, verbose
  - `dnd-kit` ✅ - Modern hooks-based, excellent a11y, modular, actively maintained, smaller bundle
- Better performance with virtualization support
- Works seamlessly with Next.js 14

### Database: Railway Postgres + Prisma
- **Why Railway over Supabase:**
  - Already using Railway for Fast Track Discord ops
  - Miles has Railway access already
  - Simpler setup, familiar infrastructure
  - Prisma provides type safety and migrations
- Real-time not critical (API polling or webhooks sufficient for Miles)

### Styling: Tailwind CSS + Custom Glassmorphism
- Fast Track brand colors: Pink (#fd4987), Purple (#6130ba)
- Glassmorphism: `backdrop-blur-xl`, `bg-white/10`, subtle borders
- Dark theme inspired by Linear

## Data Model

```prisma
model Board {
  id        String   @id @default(cuid())
  name      String
  columns   Column[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Column {
  id        String   @id @default(cuid())
  boardId   String
  board     Board    @relation(fields: [boardId], references: [id], onDelete: Cascade)
  name      String
  position  Int
  color     String?
  tasks     Task[]
  createdAt DateTime @default(now())
}

model Task {
  id          String    @id @default(cuid())
  columnId    String
  column      Column    @relation(fields: [columnId], references: [id], onDelete: Cascade)
  title       String
  description String?
  assignee    String?   // "blake" | "miles" | null
  priority    String    @default("medium") // "low" | "medium" | "high" | "urgent"
  dueDate     DateTime?
  position    Int
  labels      String[]  // Array of label strings
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
```

## API Endpoints

### Tasks
- `GET /api/tasks` - List all tasks (optional query: ?columnId=xxx)
- `POST /api/tasks` - Create a task
- `GET /api/tasks/[id]` - Get single task
- `PATCH /api/tasks/[id]` - Update task (move, edit)
- `DELETE /api/tasks/[id]` - Delete task

### Columns
- `GET /api/columns` - List all columns (with tasks)
- `POST /api/columns` - Create column
- `PATCH /api/columns/[id]` - Update column
- `DELETE /api/columns/[id]` - Delete column

### Board
- `GET /api/board` - Get board with all columns and tasks

## Features

### Phase 1 (MVP)
- [x] Kanban board with 4 default columns
- [x] Drag-and-drop tasks between columns
- [x] Task CRUD via UI
- [x] API endpoints for Miles
- [x] Fast Track branding

### Phase 2 (Future)
- [ ] Task detail modal with full editing
- [ ] Due date reminders
- [ ] Activity log
- [ ] Keyboard shortcuts
- [ ] Search/filter tasks

## Default Columns
1. **Backlog** - Ideas and future tasks
2. **To Do** - Ready to start
3. **In Progress** - Currently working on
4. **Done** - Completed tasks

## Deployment
- **Platform:** Vercel
- **Database:** Railway Postgres (new project or existing)
- **Environment Variables:**
  - `DATABASE_URL` - Railway Postgres connection string
