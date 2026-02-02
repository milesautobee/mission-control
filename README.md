# Mission Control 🚀

A Kanban-style task management board for Fast Track operations. Built for collaborative use between Blake (human) and Miles (AI assistant).

![Fast Track](https://img.shields.io/badge/Fast_Track-Operations-fd4987)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)

## Features

- 🎯 **Drag-and-drop** task management
- 🏷️ **Labels, priorities, assignees** for organization
- 🤖 **API-first design** - Miles can create/update tasks programmatically
- 🎨 **Fast Track branding** - Pink/purple glassmorphism aesthetic
- ⚡ **Real-time updates** - Changes reflect immediately

## Tech Stack

- **Frontend:** Next.js 14 (App Router)
- **Drag & Drop:** dnd-kit
- **Database:** PostgreSQL (Railway)
- **ORM:** Prisma
- **Styling:** Tailwind CSS

## API Documentation

### Tasks

#### List all tasks
```bash
GET /api/tasks
GET /api/tasks?columnId=xxx
```

#### Create a task
```bash
POST /api/tasks
Content-Type: application/json

{
  "columnId": "clxxx...",
  "title": "My task",
  "description": "Optional description",
  "assignee": "miles",  // "blake" | "miles" | null
  "priority": "high",   // "low" | "medium" | "high" | "urgent"
  "dueDate": "2025-02-15",
  "labels": ["feature", "urgent"]
}
```

#### Update a task
```bash
PATCH /api/tasks/:id
Content-Type: application/json

{
  "columnId": "new-column-id",  // Move to different column
  "title": "Updated title",
  "priority": "urgent"
}
```

#### Delete a task
```bash
DELETE /api/tasks/:id
```

### Columns

#### List all columns (with tasks)
```bash
GET /api/columns
```

### Board

#### Get entire board
```bash
GET /api/board
```

## Default Columns

1. **Backlog** - Ideas and future tasks
2. **To Do** - Ready to start  
3. **In Progress** - Currently working on
4. **Done** - Completed tasks

## Environment Variables

```env
DATABASE_URL=postgresql://...
```

## Local Development

```bash
npm install
npx prisma generate
npx prisma db push
npm run dev
```

## Deployment

Deployed on Vercel with Railway Postgres.

---

Built with ❤️ for Fast Track operations
