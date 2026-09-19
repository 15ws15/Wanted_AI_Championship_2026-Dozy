'use client';

import { useEffect, useState } from 'react';
import CalendarView from '@/components/CalendarView';
import EmptyState from '@/components/EmptyState';
import { PlusIcon } from '@/components/icons';
import TaskCard from '@/components/TaskCard';
import { dayLabel, planDay, todayStr } from '@/lib/date';
import { loadTasks, saveTasks } from '@/lib/storage';
import type { Task } from '@/types';

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [draft, setDraft] = useState('');
  // "오늘"은 브라우저에서만 정할 수 있다. 서버는 UTC라 미리 정해두면 새벽에 날짜가 어긋난다.
  const [picked, setPicked] = useState('');
  const [pick, setPick] = useState<{ id: string; reason: string } | null>(null);
  const [picking, setPicking] = useState(false);
  const [pickError, setPickError] = useState<string | null>(null);
  const [showDone, setShowDone] = useState(false);

  useEffect(() => {
    setTasks(loadTasks());
    setPicked(todayStr());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) saveTasks(tasks);
  }, [tasks, loaded]);

  function addTask(title: string) {
    setTasks((ts) => [
      ...ts,
      {
        id: crypto.randomUUID(),
        title,
        createdAt: new Date().toISOString(),
        // 달력에서 고른 날이 곧 이 일을 하려는 날이다.
        dueDate: picked,
        completedAt: null,
        steps: [],
      },
    ]);
  }

  function add(e: React.FormEvent) {
    e.preventDefault();
    const title = draft.trim();
    if (!title) return;
    addTask(title);
    setDraft('');
  }

  const onPicked = tasks.filter((t) => planDay(t) === picked);
  const open = onPicked.filter((t) => !t.completedAt);
  const done = onPicked.filter((t) => t.completedAt);

  async function recommend() {
    setPicking(true);
    setPickError(null);
    setPick(null);
    try {
      const res = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titles: open.map((t) => t.title) }),
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
    <main className="mx-auto w-full max-w-xl px-5 pb-20 pt-12 sm:pt-20 lg:max-w-5xl">
      <header className="mb-9">
        <h1 className="font-serif text-2xl tracking-tight">Dozy</h1>
        <p className="mt-1.5 text-sm text-mute">
          시작하기 어려운 일을, 지금 할 수 있는 한 가지로.
          {/* 제목과 같은 세리프로 적어 이름의 유래(Do + easy)가 드러나게 한다.
              색을 흐리면 대비가 4.5:1 아래로 떨어져서, 구분은 서체에만 맡긴다. */}
          <span className="ml-2 whitespace-nowrap font-serif">Do easy.</span>
        </p>
      </header>

      {loaded && (
        // 넓은 화면에서는 달력을 왼쪽에 세워두고 오른쪽에서 그 날 목록을 다룬다.
        // items-start가 없으면 칸이 늘어나 sticky가 걸리지 않는다.
        <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-12">
          <div className="lg:sticky lg:top-8">
            <CalendarView tasks={tasks} picked={picked} onPick={setPicked} />
          </div>

          <div>
            <h2 className="mt-8 text-[15px] font-medium lg:mt-0">{dayLabel(picked)}</h2>

            <form
              onSubmit={add}
              className="mt-1 flex items-center gap-2 border-b border-line-strong pb-2 focus-within:border-accent"
            >
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                maxLength={200}
                placeholder="예: 보고서 작성"
                aria-label={`${dayLabel(picked)}에 할 일`}
                className="min-w-0 flex-1 bg-transparent py-2 outline-none placeholder:text-mute/60"
              />
              <button
                type="submit"
                disabled={!draft.trim()}
                aria-label="할 일 추가"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-mute transition-colors hover:bg-accent-wash hover:text-accent disabled:opacity-30"
              >
                <PlusIcon className="h-5 w-5" />
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

            {/* 처음 열었을 때만 안내를 편다. 할 일이 이미 있는데 빈 날을 고른 것뿐이라면
                같은 안내를 다시 읽힐 이유가 없다. */}
            {tasks.length === 0 ? (
              <EmptyState onPick={addTask} />
            ) : (
              onPicked.length === 0 && <p className="mt-8 text-sm text-mute">이 날은 비어 있어요.</p>
            )}

            {open.length > 0 && (
              <section className="mt-8">
                <h3 className="text-[13px] text-mute">
                  남은 일 <span className="tabular-nums text-ink">{open.length}</span>
                </h3>
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
          </div>
        </div>
      )}
    </main>
  );
}
