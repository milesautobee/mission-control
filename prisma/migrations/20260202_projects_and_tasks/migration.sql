-- Rename tasks table to projects (preserves existing data)
ALTER TABLE "tasks" RENAME TO "projects";

-- Update the index names if they exist
ALTER INDEX IF EXISTS "tasks_pkey" RENAME TO "projects_pkey";

-- Create new tasks table for subtasks within projects
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create index for faster lookups
CREATE INDEX "tasks_project_id_idx" ON "tasks"("project_id");
