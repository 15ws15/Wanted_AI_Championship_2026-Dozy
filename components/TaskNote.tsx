'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * 메모는 두 줄까지만 보이고 넘치면 펼칠 수 있다.
 * 긴 메모가 할 일 목록을 밀어내면 "지금 할 하나"가 화면에서 밀려난다.
 */
export default function TaskNote({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [clipped, setClipped] = useState(false);

  useEffect(() => {
    const el = ref.current;
    // 펼친 동안에는 재지 않는다. 다 보이는 상태에서 재면 "넘친다"가 거짓이 되어
    // 접기 버튼이 사라지고 되돌릴 방법이 없어진다.
    if (!el || expanded) return;

    const check = () => setClipped(el.scrollHeight > el.clientHeight + 1);
    check();
    // 창 너비가 바뀌면 줄 수가 달라진다.
    const observer = new ResizeObserver(check);
    observer.observe(el);
    return () => observer.disconnect();
  }, [text, expanded]);

  return (
    // 오른쪽 여백은 삭제 버튼 너비다. 이만큼 비워야 더보기가 연필 아이콘 아래에 선다.
    <div className="flex items-start gap-2 pl-11 pr-11">
      <p
        ref={ref}
        className={`min-w-0 flex-1 whitespace-pre-wrap text-[13px] leading-relaxed text-mute ${
          expanded ? '' : 'line-clamp-2'
        }`}
      >
        {text}
      </p>
      {clipped && (
        <button
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="min-h-11 shrink-0 px-2 text-[13px] text-mute underline decoration-line-strong underline-offset-4 transition-colors hover:text-accent"
        >
          {expanded ? '접기' : '더보기'}
        </button>
      )}
    </div>
  );
}
