import type { Task } from '@/types';

const KEY = 'dozy.tasks';

export function loadTasks(): Task[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isTask) : [];
  } catch {
    return [];
  }
}

export function saveTasks(tasks: Task[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(tasks));
  } catch {
    // quota or private mode: the app keeps working in memory
  }
}

// Guards against a hand-edited/corrupt entry crashing the render, not just bad JSON.
function isTask(t: unknown): t is Task {
  return (
    !!t &&
    typeof t === 'object' &&
    typeof (t as Task).id === 'string' &&
    typeof (t as Task).title === 'string' &&
    Array.isArray((t as Task).steps)
  );
}
