'use client';

import { useState } from 'react';
import { dueLabel } from '@/lib/date';
import type { Task } from '@/types';

const MAX_DEPTH = 3;

type Props = {
  task: Task;
  reason: string | null;
  onChange: (fn: (t: Task) => Task) => void;
  onRemove: () => void;
};

export default function TaskCard({ task, reason, onChange, onRemove }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const done = !!task.completedAt;
  const last = task.steps[task.steps.length - 1];
  const due = task.dueDate ? dueLabel(task.dueDate) : null;

  async function split() {
    setBusy(true);
    setError(null);
    const [path, body] = last
      ? ['/api/breakdown-more', { title: task.title, previousStep: last.text }]
      : ['/api/breakdown', { title: task.title }];
    try {
      const res = await fetch(path as string, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.step) {
        setError(data.error ?? '지금은 어렵네요. 다시 눌러 주세요.');
        return;
      }
      onChange((t) => ({
        ...t,
        steps: [
          ...t.steps,
          { id: crypto.randomUUID(), text: data.step, depth: last ? last.depth + 1 : 0, completedAt: null },
        ],
      }));
    } catch {
      setError('연결이 끊긴 것 같아요. 다시 눌러 주세요.');
    } finally {
      setBusy(false);
    }
  }

  function toggleTask() {
    const at = done ? null : new Date().toISOString();
    onChange((t) => ({
      ...t,
      completedAt: at,
      steps: at ? t.steps.map((s) => ({ ...s, completedAt: s.completedAt ?? at })) : t.steps,
    }));
  }

  function toggleStep(id: string) {
    onChange((t) => ({
      ...t,
      steps: t.steps.map((s) =>
        s.id === id ? { ...s, completedAt: s.completedAt ? null : new Date().toISOString() } : s,
      ),
    }));
  }

  return (
    <li
      className={`-mx-2 rounded-2xl px-2 transition-colors ${
        reason !== null ? 'bg-accent-wash' : ''
      } ${done ? 'opacity-50' : ''}`}
    >
      {reason !== null && (
        <p className="px-2 pt-3 text-[13px] font-medium text-accent">
          이것부터 해보세요{reason && ` · ${reason}`}
        </p>
      )}

      <div className="flex items-start gap-1 py-1">
        <Check checked={done} onClick={toggleTask} label={`${task.title} 완료`} />
        <span
          className={`min-w-0 flex-1 self-center py-2 leading-relaxed ${done ? 'line-through' : ''}`}
        >
          {task.title}
        </span>
        {due && (
          <span
            className={`shrink-0 self-center text-[13px] tabular-nums ${
              due.urgent && !done ? 'font-medium text-accent' : 'text-mute'
            }`}
          >
            {due.text}
          </span>
        )}
        <button
          onClick={onRemove}
          aria-label={`${task.title} 삭제`}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-mute/60 transition-colors hover:bg-line/60 hover:text-mute"
        >
          <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
            <path
              d="M5 5l10 10M15 5L5 15"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        </button>
      </div>

      {task.steps.map((step) => (
        <div
          key={step.id}
          className="flex items-start gap-1 text-[15px]"
          style={{ paddingLeft: `${step.depth * 16}px` }}
        >
          <span className="mt-[21px] h-px w-3 shrink-0 bg-line-strong" aria-hidden="true" />
          <Check
            checked={!!step.completedAt}
            onClick={() => toggleStep(step.id)}
            label={`${step.text} 완료`}
          />
          <span
            className={`min-w-0 flex-1 self-center py-2 leading-relaxed ${
              step.completedAt ? 'text-mute line-through' : ''
            }`}
          >
            {step.text}
          </span>
        </div>
      ))}

      {!done && (!last || last.depth < MAX_DEPTH) && (
        <div
          className="pb-3 pt-1"
          style={{ paddingLeft: `${(last ? last.depth + 1 : 0) * 16 + 16}px` }}
        >
          <button
            onClick={split}
            disabled={busy}
            className="min-h-11 rounded-full border border-line-strong px-4 text-[13px] text-mute transition-colors hover:border-accent hover:bg-accent-wash hover:text-accent disabled:opacity-50"
          >
            {busy ? '생각하는 중…' : last ? '이것도 어려워요' : '쪼개기'}
          </button>
          {error && (
            <p role="status" className="mt-2 text-[13px] text-mute">
              {error}
            </p>
          )}
        </div>
      )}
    </li>
  );
}

function Check({
  checked,
  onClick,
  label,
}: {
  checked: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={onClick}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
    >
      <span
        className={`flex h-[20px] w-[20px] items-center justify-center rounded-full border transition-colors ${
          checked ? 'border-accent bg-accent' : 'border-line-strong hover:border-mute'
        }`}
      >
        {checked && (
          <svg viewBox="0 0 12 12" className="h-3 w-3 text-paper" aria-hidden="true">
            <path
              d="M2.5 6.2l2.4 2.4L9.5 4"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        )}
      </span>
    </button>
  );
}
