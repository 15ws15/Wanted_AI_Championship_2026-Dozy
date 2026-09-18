'use client';

/** 아이콘 하나짜리 버튼. 보이는 아이콘은 16px이지만 누를 영역은 44px로 맞춘다. */
export default function IconButton({
  onClick,
  label,
  disabled,
  quiet,
  children,
}: {
  onClick: () => void;
  label: string;
  disabled?: boolean;
  /** 주변 요소와 경쟁하면 안 되는 자리(삭제 등)에서 한 단계 물러선다. */
  quiet?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      disabled={disabled}
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-line/70 hover:text-ink disabled:opacity-40 ${
        quiet ? 'text-mute/60' : 'text-mute'
      }`}
    >
      {children}
    </button>
  );
}
