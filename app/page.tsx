'use client';

import { useEffect, useState } from 'react';
import TaskCard from '@/components/TaskCard';
import { dueLabel } from '@/lib/date';
import { loadTasks, saveTasks } from '@/lib/storage';
import type { Task } from '@/types';

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [draft, setDraft] = useState('');
  const [due, setDue] = useState('');
  const [pick, setPick] = useState<{ id: string; reason: string } | null>(null);
  const [picking, setPicking] = useState(false);
  const [pickError, setPickError] = useState<string | null>(null);

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
        dueDate: due || null,
        completedAt: null,
        steps: [],
      },
    ]);
    setDraft('');
    setDue('');
  }

  const open = tasks.filter((t) => !t.completedAt);

  async function recommend() {
    setPicking(true);
    setPickError(null);
    setPick(null);
    // API 계약은 titles: string[] 하나다. 추천 판단에 필요한 마감일은 제목 문자열에 실어 보낸다.
    const titles = open.map((t) => (t.dueDate ? `${t.title} (마감 ${dueLabel(t.dueDate).text})` : t.title));
    try {
      const res = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titles }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPickError(data.error ?? '지금은 어렵네요. 다시 눌러 주세요.');
        return;
      }
      const chosen = open[data.index] ?? open[0];
      if (chosen) setPick({ id: chosen.id, reason: data.reason ?? '' });
    } catch {
      setPickError('연결이 끊긴 것 같아요. 다시 눌러 주세요.');
    } finally {
      setPicking(false);
    }
  }

  // Stable sort keeps insertion order within each group; done items sink.
  const ordered = [...tasks].sort((a, b) => Number(!!a.completedAt) - Number(!!b.completedAt));

  return (
    <main className="mx-auto w-full max-w-xl px-5 pb-24 pt-12 sm:pt-20">
      <header className="mb-10">
        <h1 className="text-lg tracking-tight">Dozy</h1>
        <p className="mt-1 text-sm text-mute">시작하기 어려운 일을, 지금 할 수 있는 한 가지로.</p>
      </header>

      <form onSubmit={add} className="flex flex-wrap items-center gap-2 border-b border-line pb-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={200}
          placeholder="예: 보고서 작성"
          className="min-w-0 flex-1 basis-full bg-transparent py-1 outline-none placeholder:text-mute/60 sm:basis-0"
        />
        <input
          type="date"
          value={due}
          onChange={(e) => setDue(e.target.value)}
          aria-label="마감일 (선택)"
          className="shrink-0 bg-transparent py-1 text-[13px] text-mute outline-none"
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

      {open.length > 0 && (
        <div className="mt-5">
          <button
            onClick={recommend}
            disabled={picking}
            className="rounded-full border border-line px-4 py-1.5 text-[13px] text-mute transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
          >
            {picking ? '목록을 보는 중…' : '뭐부터 할지 모르겠어요'}
          </button>
          {pickError && <p className="mt-2 text-[13px] text-mute">{pickError}</p>}
        </div>
      )}

      {loaded && tasks.length === 0 && (
        <p className="mt-10 text-sm leading-loose text-mute">
          할 일을 하나 적어 보세요.
          <br />
          막막하면 <span className="text-ink">쪼개기</span>를 누르면 돼요.
          <br />
          지금 5분 안에 할 수 있는 행동 하나로 바꿔 드릴게요.
        </p>
      )}

      <ul className="mt-4">
        {ordered.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            reason={pick && pick.id === task.id && !task.completedAt ? pick.reason : null}
            onChange={(fn) => setTasks((ts) => ts.map((t) => (t.id === task.id ? fn(t) : t)))}
            onRemove={() => setTasks((ts) => ts.filter((t) => t.id !== task.id))}
          />
        ))}
      </ul>
    </main>
  );
}
