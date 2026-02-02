# Mission Control API Documentation

Base URL: `https://mission-control-flax.vercel.app`

## Authentication

Currently no authentication required (private use). Can add API key auth later if needed.

---

## Endpoints

### Get Board (with all columns and tasks)

```http
GET /api/board
```

**Response:**
```json
{
  "id": "board-id",
  "name": "Mission Control",
  "columns": [
    {
      "id": "column-id",
      "name": "Backlog",
      "position": 0,
      "color": "#6b7280",
      "tasks": [...]
    }
  ]
}
```

---

### List Columns

```http
GET /api/columns
```

Returns all columns with their tasks.

---

### List Tasks

```http
GET /api/tasks
GET /api/tasks?columnId=xxx
```

**Query Parameters:**
- `columnId` (optional): Filter tasks by column

---

### Get Single Task

```http
GET /api/tasks/:id
```

---

### Create Task

```http
POST /api/tasks
Content-Type: application/json

{
  "columnId": "column-id",      // Required
  "title": "Task title",        // Required
  "description": "Details",     // Optional
  "assignee": "miles",          // "blake" | "miles" | null
  "priority": "high",           // "low" | "medium" | "high" | "urgent"
  "dueDate": "2025-02-15",      // ISO date string, optional
  "labels": ["feature", "api"]  // Array of strings, optional
}
```

**Response:** Created task object with `id`

---

### Update Task

```http
PATCH /api/tasks/:id
Content-Type: application/json

{
  "columnId": "new-column-id",  // Move to different column
  "title": "Updated title",
  "description": "New description",
  "assignee": "blake",
  "priority": "urgent",
  "dueDate": null,              // Remove due date
  "position": 0,                // Reorder within column
  "labels": ["updated"]
}
```

All fields are optional. Only include what you want to change.

---

### Delete Task

```http
DELETE /api/tasks/:id
```

**Response:** `{ "success": true }`

---

## Column IDs (Current)

| Column | ID |
|--------|-----|
| Backlog | `cml4j2omd00018f1gec7w554w` |
| To Do | `cml4j2omd00028f1gyotuu2ff` |
| In Progress | `cml4j2omd00038f1gi098xjno` |
| Done | `cml4j2omd00048f1gd2x21b33` |

---

## Examples

### Create a task (Miles adding work)
```bash
curl -X POST "https://mission-control-flax.vercel.app/api/tasks" \
  -H "Content-Type: application/json" \
  -d '{
    "columnId": "cml4j2omd00018f1gec7w554w",
    "title": "Implement feature X",
    "description": "Details about the work",
    "assignee": "miles",
    "priority": "medium",
    "labels": ["feature"]
  }'
```

### Move task to In Progress
```bash
curl -X PATCH "https://mission-control-flax.vercel.app/api/tasks/TASK_ID" \
  -H "Content-Type: application/json" \
  -d '{"columnId": "cml4j2omd00038f1gi098xjno"}'
```

### Mark task done
```bash
curl -X PATCH "https://mission-control-flax.vercel.app/api/tasks/TASK_ID" \
  -H "Content-Type: application/json" \
  -d '{"columnId": "cml4j2omd00048f1gd2x21b33"}'
```

### Get all current tasks
```bash
curl "https://mission-control-flax.vercel.app/api/tasks"
```
