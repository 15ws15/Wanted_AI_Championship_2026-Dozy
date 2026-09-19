'use client';

import { useState } from 'react';
import Check from '@/components/Check';
import IconButton from '@/components/IconButton';
import { RetryIcon, XIcon } from '@/components/icons';
import { planDay, rescheduleTarget } from '@/lib/date';
import type { Step, Task } from '@/types';

const MAX_DEPTH = 3;

/**
 * 쪼개진 행동들과 거기에 딸린 버튼들. 이 서비스의 핵심 장치라서 할 일 카드에서
 * 따로 떼어 둔다. 들여쓰기 깊이가 "얼마나 잘게 쪼갰는지"를 그대로 보여준다.
 */
export default function StepLadder({
  task,
  done,
  onChange,
}: {
  task: Task;
  done: boolean;
  onChange: (fn: (t: Task) => Task) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const steps = task.steps;
  const last = steps[steps.length - 1];
  const move = rescheduleTarget(planDay(task));

  /** prev 다음에 올 행동을 받아온다. prev가 없으면 할 일 자체의 첫 행동이다. */
  async function fetchStep(prev: Step | undefined): Promise<string | null> {
    setBusy(true);
    setError(null);
    const [path, body] = prev
      ? ['/api/breakdown-more', { title: task.title, previousStep: prev.text }]
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
        return null;
      }
      return data.step as string;
    } catch {
      setError('연결이 끊긴 것 같아요. 다시 눌러 주세요.');
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function split() {
    const text = await fetchStep(last);
    if (!text) return;
    onChange((t) => ({
      ...t,
      steps: [
        ...t.steps,
        { id: crypto.randomUUID(), text, depth: last ? last.depth + 1 : 0, completedAt: null },
      ],
    }));
  }

  /** 마지막 행동이 마음에 들지 않을 때. 같은 자리에 다시 받아 끼운다. */
  async function retry() {
    const prev = steps[steps.length - 2];
    let text = await fetchStep(prev);
    // 모델은 매번 다른 답을 주지만 깊은 단계일수록 답 공간이 좁아 겹칠 수 있다.
    // 눌렀는데 같은 문장이 그대로면 고장난 것처럼 보이므로 한 번만 더 받아본다.
    if (text && text === last?.text) text = await fetchStep(prev);
    if (!text) return;
    onChange((t) => ({
      ...t,
      steps: t.steps.map((s, i) =>
        i === t.steps.length - 1 ? { ...s, text, completedAt: null } : s,
      ),
    }));
  }

  function dropLast() {
    setError(null);
    onChange((t) => ({ ...t, steps: t.steps.slice(0, -1) }));
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
    <>
      {steps.map((step) => (
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

      {!done && (
        <div
          className="flex flex-wrap items-center gap-1 pb-3 pt-1"
          style={{ paddingLeft: `${(last ? last.depth + 1 : 0) * 16 + 16}px` }}
        >
          {(!last || last.depth < MAX_DEPTH) && (
            <button
              onClick={split}
              disabled={busy}
              className="min-h-11 rounded-full border border-line-strong px-4 text-[13px] text-mute transition-colors hover:border-accent hover:bg-accent-wash hover:text-accent disabled:opacity-50"
            >
              {busy ? '생각하는 중…' : last ? '이것도 어려워요' : '쪼개기'}
            </button>
          )}

          {/* 사슬의 마지막 칸만 되돌린다. 중간을 지우면 그 아래가 근거를 잃는다. */}
          {last && (
            <>
              <IconButton onClick={retry} label="다른 행동으로 다시 받기" disabled={busy}>
                <RetryIcon />
              </IconButton>
              <IconButton onClick={dropLast} label="이 행동 지우기" disabled={busy} quiet>
                <XIcon />
              </IconButton>
            </>
          )}

          {move && (
            <button
              onClick={() => onChange((t) => ({ ...t, dueDate: move.to }))}
              className="min-h-11 rounded-full px-3 text-[13px] text-mute transition-colors hover:text-accent"
            >
              {move.label}
            </button>
          )}

          {error && (
            <p role="status" className="basis-full text-[13px] text-mute">
              {error}
            </p>
          )}
        </div>
      )}
    </>
  );
}
