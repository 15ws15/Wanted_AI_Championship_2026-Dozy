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
        <button
          onClick={() => setMonth(shiftMonth(month, -1))}
          aria-label="이전 달"
          className="px-3 py-1 text-mute transition-colors hover:text-ink"
        >
          ‹
        </button>
        <h2 className="text-[15px]">{monthLabel(month)}</h2>
        <button
          onClick={() => setMonth(shiftMonth(month, 1))}
          aria-label="다음 달"
          className="px-3 py-1 text-mute transition-colors hover:text-ink"
        >
          ›
        </button>
      </header>

      <div className="mt-4 grid grid-cols-7 text-center text-[13px]">
        {WEEKDAYS.map((d) => (
          <div key={d} className="pb-2 text-mute/70">
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
              className={`relative mx-auto my-[2px] flex h-9 w-9 flex-col items-center justify-center rounded-full transition-colors ${
                picked === date ? 'bg-accent text-paper' : 'hover:bg-line/50'
              } ${date === today && picked !== date ? 'text-accent' : ''}`}
            >
              {Number(date.slice(8))}
              {byDate[date] && (
                <span
                  className={`absolute bottom-[5px] h-1 w-1 rounded-full ${
                    picked === date ? 'bg-paper' : 'bg-accent'
                  }`}
                />
              )}
            </button>
          ),
        )}
      </div>

      {picked && (
        <div className="mt-6 border-t border-line pt-4">
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
