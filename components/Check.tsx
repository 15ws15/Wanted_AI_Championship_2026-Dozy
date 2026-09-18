'use client';

import { TickIcon } from '@/components/icons';

/** 보이는 원은 20px이지만 누를 수 있는 영역은 44px이다. 손가락 기준을 맞추려는 것이다. */
export default function Check({
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
          checked ? 'border-accent bg-accent text-paper' : 'border-line-strong hover:border-mute'
        }`}
      >
        {checked && <TickIcon />}
      </span>
    </button>
  );
}
