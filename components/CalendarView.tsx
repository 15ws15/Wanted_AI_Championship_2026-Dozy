'use client';

import { useState } from 'react';
import { monthCells, monthLabel, shiftMonth, thisMonth, todayStr } from '@/lib/date';
import type { Task } from '@/types';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export default function CalendarView({ tasks }: { tasks: Task[] }) {
  const [month, setMonth] = useState(thisMonth());
  const [picked, setPicked] = useState<string | null>(todayStr());

  const byDate: Record<string, Task[]> = {};
  for (const t of tasks) if (t.dueDate) (byDate[t.dueDate] ??= []).push(t);

  const today = todayStr();
  // 데이터가 없는 날짜를 눌러도 빈 배열을 받는다. 여기서 깨지면 안 된다.
  const onPicked = picked ? (byDate[picked] ?? []) : [];

  return (
    <section className="mt-6">
      <header className="flex items-center justify-between">
        <Arrow onClick={() => setMonth(shiftMonth(month, -1))} label="이전 달" dir="left" />
        <h2 className="text-[15px] font-medium tabular-nums">{monthLabel(month)}</h2>
        <Arrow onClick={() => setMonth(shiftMonth(month, 1))} label="다음 달" dir="right" />
      </header>

      <div className="mt-3 grid grid-cols-7 text-center text-[13px]">
        {WEEKDAYS.map((d) => (
          <div key={d} className="pb-1 text-mute/70">
            {d}
          </div>
        ))}

        {monthCells(month).map((date, i) =>
          date === null ? (
            <div key={`pad-${i}`} />
          ) : (
            <button
              key={date}
              onClick={() => setPicked(date)}
              aria-pressed={picked === date}
              className={`relative flex h-11 w-full flex-col items-center justify-center rounded-xl tabular-nums transition-colors ${
                picked === date
                  ? 'bg-accent font-medium text-paper'
                  : date === today
                    ? 'font-medium text-accent hover:bg-accent-wash'
                    : 'hover:bg-line/70'
              }`}
            >
              {Number(date.slice(8))}
              {byDate[date] && (
                <span
                  aria-hidden="true"
                  className={`absolute bottom-[7px] h-1 w-1 rounded-full ${
                    picked === date ? 'bg-paper' : 'bg-accent'
                  }`}
                />
              )}
            </button>
          ),
        )}
      </div>

      {picked && (
        <div className="mt-5 border-t border-line pt-4">
          {onPicked.length === 0 ? (
            <p className="text-sm text-mute">이 날은 비어 있어요.</p>
          ) : (
            <ul className="space-y-3">
              {onPicked.map((t) => (
                <li
                  key={t.id}
                  className={`text-sm leading-relaxed ${t.completedAt ? 'text-mute line-through' : ''}`}
                >
                  {t.title}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}

function Arrow({
  onClick,
  label,
  dir,
}: {
  onClick: () => void;
  label: string;
  dir: 'left' | 'right';
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="flex h-11 w-11 items-center justify-center rounded-full text-mute transition-colors hover:bg-line/70 hover:text-ink"
    >
      <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
        <path
          d={dir === 'left' ? 'M12.5 4L6.5 10l6 6' : 'M7.5 4l6 6-6 6'}
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </button>
  );
}
