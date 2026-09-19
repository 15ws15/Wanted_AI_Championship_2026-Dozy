'use client';

import { useEffect, useRef } from 'react';

/**
 * 네이티브 <dialog> 껍데기. 포커스 가둠, Escape 닫기, 배경 가리개가 전부
 * 브라우저 기본으로 따라온다. 직접 만들면 그 셋을 다시 구현하게 된다.
 *
 * 위치만은 직접 잡는다. Tailwind preflight가 모든 요소의 margin을 0으로 만들어서
 * dialog를 가운데 세우던 margin:auto가 지워지기 때문이다. 이 한 줄이 두 곳에
 * 흩어져 있으면 한쪽만 고쳐질 수 있어 여기로 모았다.
 */
export default function Modal({
  open,
  onClose,
  labelledBy,
  className = '',
  children,
}: {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // 이미 열린 dialog에 showModal을 부르면 예외가 난다.
    if (open) {
      if (!el.open) el.showModal();
    } else if (el.open) {
      el.close();
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby={labelledBy}
      style={{ left: '50%', top: '50%', margin: 0, transform: 'translate(-50%, -50%)' }}
      className={`fixed rounded-2xl border border-line bg-paper p-0 text-ink backdrop:bg-ink/40 ${className}`}
    >
      {children}
    </dialog>
  );
}
