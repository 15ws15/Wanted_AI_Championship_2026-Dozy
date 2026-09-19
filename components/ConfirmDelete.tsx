'use client';

import { useEffect, useRef } from 'react';
import type { Task } from '@/types';

/**
 * 할 일 삭제는 되돌릴 수 없고 쪼개 둔 행동까지 같이 사라지므로 한 번 묻는다.
 * 쪼갠 행동 하나를 지우는 것은 다시 받으면 그만이라 묻지 않는다.
 *
 * 가운데 정렬을 직접 잡는 이유는 Tailwind preflight가 모든 요소의 margin을 0으로
 * 만들어, dialog를 가운데 세우던 margin:auto가 지워지기 때문이다.
 */
export default function ConfirmDelete({
  task,
  onConfirm,
  onClose,
}: {
  task: Task | null;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!task) {
      if (el.open) el.close();
    } else if (!el.open) {
      // 이미 열린 dialog에 showModal을 부르면 예외가 난다.
      el.showModal();
    }
  }, [task]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby="confirm-title"
      style={{ left: '50%', top: '50%', margin: 0, transform: 'translate(-50%, -50%)' }}
      className="fixed w-[min(92vw,26rem)] rounded-2xl border border-line bg-paper p-0 text-ink backdrop:bg-ink/40"
    >
      <div className="px-6 pb-5 pt-6">
        <h2 id="confirm-title" className="text-[15px] font-medium">
          할 일 삭제
        </h2>
        <p className="mt-4 leading-relaxed">
          <span className="font-medium">{task?.title}</span>
          <span className="text-mute"> 을(를) 정말 삭제할까요?</span>
        </p>
        {!!task?.steps.length && (
          <p className="mt-1.5 text-[13px] text-mute">
            쪼개 둔 행동 {task.steps.length}개도 함께 사라져요.
          </p>
        )}
      </div>

      <footer className="flex items-center justify-end gap-1 px-5 pb-4">
        <button
          onClick={onClose}
          className="min-h-11 rounded-full px-4 text-[13px] text-mute transition-colors hover:text-ink"
        >
          취소
        </button>
        <button
          onClick={onConfirm}
          className="min-h-11 rounded-full bg-danger px-5 text-[13px] font-medium text-paper transition-opacity hover:opacity-90"
        >
          삭제하기
        </button>
      </footer>
    </dialog>
  );
}
