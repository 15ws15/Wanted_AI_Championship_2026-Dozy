'use client';

import { useState } from 'react';
import EmptyState from '@/components/EmptyState';
import TaskCard from '@/components/TaskCard';
import { PlusIcon } from '@/components/icons';
import { dayLabel } from '@/lib/date';
import type { Task } from '@/types';

/** 고른 하루에 관한 모든 조작 — 적고, 추천받고, 체크하는 자리. */
export default function DayPanel({
  picked,
  tasks,
  firstRun,
  onAdd,
  onChange,
  onRemove,
  onEdit,
}: {
  picked: string;
  /** 고른 날의 할 일만 들어온다. */
  tasks: Task[];
  /** 저장된 할 일이 하나도 없는 상태. 처음 열었을 때만 안내를 편다. */
  firstRun: boolean;
  onAdd: (title: string) => void;
  onChange: (id: string, fn: (t: Task) => Task) => void;
  onRemove: (id: string) => void;
  onEdit: (task: Task) => void;
}) {
  const [draft, setDraft] = useState('');
  const [pick, setPick] = useState<{ id: string; reason: string } | null>(null);
  const [picking, setPicking] = useState(false);
  const [pickError, setPickError] = useState<string | null>(null);
  const [showDone, setShowDone] = useState(false);

  const open = tasks.filter((t) => !t.completedAt);
  const done = tasks.filter((t) => t.completedAt);

  function add(e: React.FormEvent) {
    e.preventDefault();
    const title = draft.trim();
    if (!title) return;
    onAdd(title);
    setDraft('');
  }

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
      onChange={(fn) => onChange(task.id, fn)}
      onRemove={() => onRemove(task.id)}
      onEdit={() => onEdit(task)}
    />
  );

  return (
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

      {firstRun ? (
        <EmptyState onPick={onAdd} />
      ) : (
        tasks.length === 0 && <p className="mt-8 text-sm text-mute">이 날은 비어 있어요.</p>
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
  );
}
