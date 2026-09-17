'use client';

import { useEffect, useState } from 'react';
import TaskCard from '@/components/TaskCard';
import { loadTasks, saveTasks } from '@/lib/storage';
import type { Task } from '@/types';

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    setTasks(loadTasks());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) saveTasks(tasks);
  }, [tasks, loaded]);

  function add(e: React.FormEvent) {
    e.preventDefault();
    const title = draft.trim();
    if (!title) return;
    setTasks((ts) => [
      ...ts,
      {
        id: crypto.randomUUID(),
        title,
        createdAt: new Date().toISOString(),
        dueDate: null,
        completedAt: null,
        steps: [],
      },
    ]);
    setDraft('');
  }

  // Stable sort keeps insertion order within each group; done items sink.
  const ordered = [...tasks].sort((a, b) => Number(!!a.completedAt) - Number(!!b.completedAt));

  return (
    <main className="mx-auto w-full max-w-xl px-5 pb-24 pt-12 sm:pt-20">
      <header className="mb-10">
        <h1 className="text-lg tracking-tight">Dozy</h1>
        <p className="mt-1 text-sm text-mute">시작하기 어려운 일을, 지금 할 수 있는 한 가지로.</p>
      </header>

      <form onSubmit={add} className="flex items-center gap-2 border-b border-line pb-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={200}
          placeholder="예: 보고서 작성"
          className="flex-1 bg-transparent py-1 outline-none placeholder:text-mute/60"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          className="shrink-0 px-2 text-xl text-mute transition-colors hover:text-accent disabled:opacity-30"
          aria-label="추가"
        >
          +
        </button>
      </form>

      {loaded && tasks.length === 0 && (
        <p className="mt-10 text-sm leading-loose text-mute">
          할 일을 하나 적어 보세요.
          <br />
          막막하면 <span className="text-ink">쪼개기</span>를 누르면 돼요.
          <br />
          지금 5분 안에 할 수 있는 행동 하나로 바꿔 드릴게요.
        </p>
      )}

      <ul className="mt-2">
        {ordered.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onChange={(fn) => setTasks((ts) => ts.map((t) => (t.id === task.id ? fn(t) : t)))}
            onRemove={() => setTasks((ts) => ts.filter((t) => t.id !== task.id))}
          />
        ))}
      </ul>
    </main>
  );
}
