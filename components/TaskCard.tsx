'use client';

import { useState } from 'react';
import type { Task } from '@/types';

const MAX_DEPTH = 3;

type Props = {
  task: Task;
  onChange: (fn: (t: Task) => Task) => void;
  onRemove: () => void;
};

export default function TaskCard({ task, onChange, onRemove }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const done = !!task.completedAt;
  const last = task.steps[task.steps.length - 1];

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
    <li className={`border-b border-line py-4 transition-opacity ${done ? 'opacity-40' : ''}`}>
      <div className="flex items-start gap-3">
        <Check checked={done} onClick={toggleTask} />
        <span className={`flex-1 leading-relaxed ${done ? 'line-through' : ''}`}>{task.title}</span>
        <button
          onClick={onRemove}
          aria-label="삭제"
          className="px-1 text-mute/50 transition-colors hover:text-mute"
        >
          ×
        </button>
      </div>

      {task.steps.map((step) => (
        <div
          key={step.id}
          className="mt-3 flex items-start gap-3 text-[15px]"
          style={{ paddingLeft: `${step.depth * 18 + 10}px` }}
        >
          <span className="mt-[7px] h-px w-3 shrink-0 bg-line" />
          <Check checked={!!step.completedAt} onClick={() => toggleStep(step.id)} />
          <span className={`flex-1 leading-relaxed ${step.completedAt ? 'text-mute line-through' : ''}`}>
            {step.text}
          </span>
        </div>
      ))}

      {!done && (!last || last.depth < MAX_DEPTH) && (
        <div style={{ paddingLeft: `${(last ? last.depth + 1 : 0) * 18 + 26}px` }} className="mt-3">
          <button
            onClick={split}
            disabled={busy}
            className="rounded-full border border-line px-3 py-1 text-[13px] text-mute transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
          >
            {busy ? '생각하는 중…' : last ? '이것도 어려워요' : '쪼개기'}
          </button>
          {error && (
            <p className="mt-2 text-[13px] text-mute">
              {error}
            </p>
          )}
        </div>
      )}
    </li>
  );
}

function Check({ checked, onClick }: { checked: boolean; onClick: () => void }) {
  return (
    <button
      role="checkbox"
      aria-checked={checked}
      onClick={onClick}
      className={`mt-[3px] h-[18px] w-[18px] shrink-0 rounded-full border transition-colors ${
        checked ? 'border-accent bg-accent' : 'border-line hover:border-mute'
      }`}
    />
  );
}
