'use client';

import { useEffect, useState } from 'react';
import CalendarView from '@/components/CalendarView';
import EmptyState from '@/components/EmptyState';
import HistoryView from '@/components/HistoryView';
import TaskCard from '@/components/TaskCard';
import ViewTabs, { type View } from '@/components/ViewTabs';
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
  const [view, setView] = useState<View>('list');
  const [showDone, setShowDone] = useState(false);

  useEffect(() => {
    setTasks(loadTasks());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) saveTasks(tasks);
  }, [tasks, loaded]);

  function addTask(title: string, dueDate: string | null = null) {
    setTasks((ts) => [
      ...ts,
      {
        id: crypto.randomUUID(),
        title,
        createdAt: new Date().toISOString(),
        dueDate,
        completedAt: null,
        steps: [],
      },
    ]);
  }

  function add(e: React.FormEvent) {
    e.preventDefault();
    const title = draft.trim();
    if (!title) return;
    addTask(title, due || null);
    setDraft('');
    setDue('');
  }

  const open = tasks.filter((t) => !t.completedAt);
  const done = tasks.filter((t) => t.completedAt);

  async function recommend() {
    setPicking(true);
    setPickError(null);
    setPick(null);
    // API 계약은 titles: string[] 하나다. 추천 판단에 필요한 마감일은 제목 문자열에 실어 보낸다.
    const titles = open.map((t) =>
      t.dueDate ? `${t.title} (마감 ${dueLabel(t.dueDate).text})` : t.title,
    );
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

  const card = (task: Task) => (
    <TaskCard
      key={task.id}
      task={task}
      reason={pick && pick.id === task.id && !task.completedAt ? pick.reason : null}
      onChange={(fn) => setTasks((ts) => ts.map((t) => (t.id === task.id ? fn(t) : t)))}
      onRemove={() => setTasks((ts) => ts.filter((t) => t.id !== task.id))}
    />
  );

  return (
    <main className="mx-auto w-full max-w-xl px-5 pb-20 pt-12 sm:pt-20">
      <header className="mb-9">
        <h1 className="font-serif text-2xl tracking-tight">Dozy</h1>
        <p className="mt-1.5 text-sm text-mute">시작하기 어려운 일을, 지금 할 수 있는 한 가지로.</p>
      </header>

      {view === 'list' && (
        <>
          <form
            onSubmit={add}
            className="flex flex-wrap items-center gap-2 border-b border-line-strong pb-2 focus-within:border-accent"
          >
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={200}
              placeholder="예: 보고서 작성"
              aria-label="할 일"
              className="min-w-0 flex-1 basis-full bg-transparent py-2 outline-none placeholder:text-mute/60 sm:basis-0"
            />
            <input
              type="date"
              value={due}
              onChange={(e) => setDue(e.target.value)}
              aria-label="마감일 (선택)"
              className="min-h-11 shrink-0 bg-transparent text-[13px] text-mute outline-none"
            />
            <button
              type="submit"
              disabled={!draft.trim()}
              aria-label="할 일 추가"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-mute transition-colors hover:bg-accent-wash hover:text-accent disabled:opacity-30"
            >
              <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden="true">
                <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
          </form>

          {open.length > 0 && (
            <div className="mt-5">
              <button
                onClick={recommend}
                disabled={picking}
                className="min-h-11 rounded-full bg-accent px-5 text-[13px] font-medium text-paper transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {picking ? '목록을 보는 중…' : '뭐부터 할지 모르겠어요'}
              </button>
              {pickError && (
                <p role="status" className="mt-2 text-[13px] text-mute">
                  {pickError}
                </p>
              )}
            </div>
          )}

          {loaded && tasks.length === 0 && <EmptyState onPick={(t) => addTask(t)} />}

          {open.length > 0 && (
            <section className="mt-8">
              <h2 className="text-[13px] text-mute">
                남은 일 <span className="tabular-nums text-ink">{open.length}</span>
              </h2>
              <ul className="mt-1 divide-y divide-line">{open.map(card)}</ul>
            </section>
          )}

          {done.length > 0 && (
            <section className="mt-9">
              <button
                onClick={() => setShowDone((v) => !v)}
                aria-expanded={showDone}
                className="min-h-11 text-[13px] text-mute transition-colors hover:text-ink"
              >
                끝낸 일 <span className="tabular-nums">{done.length}</span>
                <span aria-hidden="true">{showDone ? ' ⌃' : ' ⌄'}</span>
              </button>
              {showDone && <ul className="divide-y divide-line">{done.map(card)}</ul>}
            </section>
          )}
        </>
      )}

      {view === 'calendar' && <CalendarView tasks={tasks} />}
      {view === 'history' && <HistoryView tasks={tasks} />}

      <ViewTabs view={view} onChange={setView} />
    </main>
  );
}
