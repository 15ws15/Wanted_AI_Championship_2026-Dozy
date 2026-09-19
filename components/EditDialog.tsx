'use client';

import { useEffect, useState } from 'react';
import IconButton from '@/components/IconButton';
import Modal from '@/components/Modal';
import { XIcon } from '@/components/icons';
import { planDay } from '@/lib/date';
import type { Task } from '@/types';

type Patch = { title: string; dueDate: string; note: string | null };

export default function EditDialog({
  task,
  onSave,
  onClose,
}: {
  task: Task | null;
  onSave: (patch: Patch) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!task) return;
    setTitle(task.title);
    setDate(planDay(task));
    setNote(task.note ?? '');
  }, [task]);

  function save(e: React.FormEvent) {
    e.preventDefault();
    const next = title.trim();
    if (!next || !date) return;
    onSave({ title: next, dueDate: date, note: note.trim() || null });
  }

  return (
    <Modal open={!!task} onClose={onClose} labelledBy="edit-title" className="w-[min(92vw,30rem)]">
      <form onSubmit={save}>
        <header className="flex items-center justify-between border-b border-line py-3 pl-5 pr-3">
          <h2 id="edit-title" className="text-[15px] font-medium">
            할 일 수정
          </h2>
          <IconButton onClick={onClose} label="닫기" quiet>
            <XIcon />
          </IconButton>
        </header>

        <div className="space-y-5 px-5 py-5">
          <div>
            <label htmlFor="edit-name" className="text-[13px] text-mute">
              제목
            </label>
            <input
              id="edit-name"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              required
              className="mt-1.5 w-full rounded-xl border border-line bg-surface px-3 py-2.5 outline-none focus:border-accent"
            />
          </div>

          <div>
            <label htmlFor="edit-date" className="text-[13px] text-mute">
              날짜
            </label>
            <input
              id="edit-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="mt-1.5 w-full rounded-xl border border-line bg-surface px-3 py-2.5 tabular-nums outline-none focus:border-accent"
            />
            <p className="mt-1.5 text-[13px] text-mute">
              날짜를 바꾸면 쪼개 둔 행동도 같이 옮겨 가요.
            </p>
          </div>

          <div>
            <label htmlFor="edit-note" className="text-[13px] text-mute">
              메모 (선택)
            </label>
            <textarea
              id="edit-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="필요한 메모를 적어 보세요"
              className="mt-1.5 w-full resize-none rounded-xl border border-line bg-surface px-3 py-2.5 leading-relaxed outline-none placeholder:text-mute/60 focus:border-accent"
            />
          </div>
        </div>

        <footer className="flex items-center justify-end gap-1 border-t border-line px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 rounded-full px-4 text-[13px] text-mute transition-colors hover:text-ink"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={!title.trim() || !date}
            className="min-h-11 rounded-full bg-accent px-5 text-[13px] font-medium text-paper transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            저장하기
          </button>
        </footer>
      </form>
    </Modal>
  );
}
