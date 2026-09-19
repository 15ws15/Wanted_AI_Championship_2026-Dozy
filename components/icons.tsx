// 글자(× · ‹ ›)를 아이콘으로 쓰면 폰트에 따라 모양과 세로 정렬이 흔들린다.
// 선 굵기와 크기를 한 곳에서 맞춰두기 위해 SVG로 모아둔다.

type Props = { className?: string };

const stroke = {
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  fill: 'none',
};

function Svg({ className = 'h-4 w-4', children }: Props & { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden="true">
      {children}
    </svg>
  );
}

export const XIcon = (p: Props) => (
  <Svg {...p}>
    <path d="M5 5l10 10M15 5L5 15" {...stroke} />
  </Svg>
);

export const PlusIcon = (p: Props) => (
  <Svg {...p}>
    <path d="M10 4v12M4 10h12" {...stroke} />
  </Svg>
);

export const RetryIcon = (p: Props) => (
  <Svg {...p}>
    <path d="M16 10a6 6 0 11-1.8-4.3" {...stroke} />
    <path d="M16 3.5V6h-2.5" {...stroke} />
  </Svg>
);

export const PencilIcon = (p: Props) => (
  <Svg {...p}>
    <path d="M13.2 3.8a1.7 1.7 0 012.4 2.4L7 14.8l-3.2.8.8-3.2 8.6-8.6z" {...stroke} />
  </Svg>
);

export const ChevronIcon = ({ dir, ...p }: Props & { dir: 'left' | 'right' }) => (
  <Svg {...p}>
    <path d={dir === 'left' ? 'M12.5 4L6.5 10l6 6' : 'M7.5 4l6 6-6 6'} {...stroke} />
  </Svg>
);

export const TickIcon = ({ className = 'h-3 w-3' }: Props) => (
  <svg viewBox="0 0 12 12" className={className} aria-hidden="true">
    <path
      d="M2.5 6.2l2.4 2.4L9.5 4"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);
