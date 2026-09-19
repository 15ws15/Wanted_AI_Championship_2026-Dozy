'use client';

import { useEffect, useRef, useState } from 'react';
import IconButton from '@/components/IconButton';
import { XIcon } from '@/components/icons';
import { planDay } from '@/lib/date';
import type { Task } from '@/types';

type Patch = { title: string; dueDate: string; note: string | null };
type Pos = { x: number; y: number };

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

/**
 * 네이티브 <dialog>를 쓴다. 포커스 가둠, Escape 닫기, 배경 가리개가 전부
 * 브라우저 기본으로 따라온다. 직접 만들면 그 셋을 다시 구현하게 된다.
 *
 * 위치만은 직접 잡는다. Tailwind preflight가 모든 요소의 margin을 0으로 만들어서
 * dialog를 가운데 세우던 margin:auto가 지워지기 때문이다.
 */
export default function EditDialog({
  task,
  onSave,
  onClose,
}: {
  task: Task | null;
  onSave: (patch: Patch) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');
  /** null이면 가운데. 끌어서 옮긴 뒤에만 좌표를 갖는다. */
  const [pos, setPos] = useState<Pos | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!task) {
      if (el.open) el.close();
      return;
    }
    setTitle(task.title);
    setDate(planDay(task));
    setNote(task.note ?? '');
    setPos(null); // 열 때마다 가운데에서 시작한다
    // 이미 열린 dialog에 showModal을 부르면 예외가 난다.
    if (!el.open) el.showModal();
  }, [task]);

  function startDrag(e: React.PointerEvent) {
    const el = ref.current;
    // 머리말 안의 닫기 버튼을 누른 것이라면 끌기가 아니다.
    if (!el || (e.target as HTMLElement).closest('button')) return;

    const box = el.getBoundingClientRect();
    const grabX = e.clientX - box.left;
    const grabY = e.clientY - box.top;

    const onMove = (ev: PointerEvent) => {
      // 창 밖으로 완전히 내보내면 다시 잡을 수 없다. 머리말은 항상 화면에 남긴다.
      setPos({
        x: clamp(ev.clientX - grabX, 8, window.innerWidth - box.width - 8),
        y: clamp(ev.clientY - grabY, 8, window.innerHeight - 56),
      });
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }

  function save(e: React.FormEvent) {
    e.preventDefault();
    const next = title.trim();
    if (!next || !date) return;
    onSave({ title: next, dueDate: date, note: note.trim() || null });
  }

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby="edit-title"
      style={
        pos
          ? { left: pos.x, top: pos.y, margin: 0, transform: 'none' }
          : { left: '50%', top: '50%', margin: 0, transform: 'translate(-50%, -50%)' }
      }
      className="fixed w-[min(92vw,30rem)] rounded-2xl border border-line bg-paper p-0 text-ink backdrop:bg-ink/40"
    >
      <form onSubmit={save}>
        <header
          onPointerDown={startDrag}
          className="flex touch-none cursor-move items-center justify-between border-b border-line py-3 pl-5 pr-3"
        >
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
    </dialog>
  );
}
