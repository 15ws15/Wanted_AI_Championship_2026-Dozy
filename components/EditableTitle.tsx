'use client';

import { useEffect, useRef, useState } from 'react';

const BASE = 'min-w-0 flex-1 self-center py-2 leading-relaxed';

export default function EditableTitle({
  value,
  done,
  onSave,
}: {
  value: string;
  done: boolean;
  onSave: (next: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) input.current?.select();
  }, [editing]);

  function cancel() {
    setDraft(value);
    setEditing(false);
  }

  function commit() {
    const next = draft.trim();
    // 빈 제목은 받지 않는다. 지우려는 것이라면 삭제 버튼이 따로 있다.
    if (next && next !== value) onSave(next);
    else setDraft(value);
    setEditing(false);
  }

  if (!editing) {
    return (
      <button
        onClick={() => {
          setDraft(value);
          setEditing(true);
        }}
        title="눌러서 고치기"
        className={`${BASE} rounded-md text-left ${done ? 'line-through' : ''}`}
      >
        {value}
      </button>
    );
  }

  return (
    <input
      ref={input}
      autoFocus
      value={draft}
      maxLength={200}
      aria-label="할 일 제목 고치기"
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') commit();
        if (e.key === 'Escape') cancel();
      }}
      className={`${BASE} rounded-md bg-surface px-1 outline-none`}
    />
  );
}
