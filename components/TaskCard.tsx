'use client';

import Check from '@/components/Check';
import IconButton from '@/components/IconButton';
import StepLadder from '@/components/StepLadder';
import { NoteIcon, PencilIcon, XIcon } from '@/components/icons';
import type { Task } from '@/types';

type Props = {
  task: Task;
  reason: string | null;
  onChange: (fn: (t: Task) => Task) => void;
  onRemove: () => void;
  onEdit: () => void;
};

export default function TaskCard({ task, reason, onChange, onRemove, onEdit }: Props) {
  const done = !!task.completedAt;

  function toggleTask() {
    const at = done ? null : new Date().toISOString();
    onChange((t) => ({
      ...t,
      completedAt: at,
      steps: at ? t.steps.map((s) => ({ ...s, completedAt: s.completedAt ?? at })) : t.steps,
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
        <IconButton onClick={onEdit} label={`${task.title} 수정`} quiet>
          <PencilIcon />
        </IconButton>
        <IconButton onClick={onRemove} label={`${task.title} 삭제`} quiet>
          <XIcon />
        </IconButton>
      </div>

      {/* 적을 수만 있고 볼 수 없으면 메모가 아니다. 제목 아래에 조용히 둔다. */}
      {task.note && (
        <p className="flex gap-1.5 pb-2 pl-11 text-[13px] leading-relaxed text-mute">
          <NoteIcon className="mt-[3px] h-3.5 w-3.5 shrink-0" />
          <span className="whitespace-pre-wrap">{task.note}</span>
        </p>
      )}

      <StepLadder task={task} done={done} onChange={onChange} />
    </li>
  );
}
