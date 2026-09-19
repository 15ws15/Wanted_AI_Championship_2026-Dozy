'use client';

import { useState } from 'react';
import IconButton from '@/components/IconButton';
import { ChevronIcon } from '@/components/icons';
import {
  dayProgress,
  monthCells,
  monthLabel,
  planDay,
  shiftMonth,
  thisMonth,
  todayStr,
} from '@/lib/date';
import type { Task } from '@/types';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

/**
 * 고른 날짜는 페이지가 갖는다. 달력이 날짜를 고르는 도구이면서 동시에
 * 그 날 목록을 여는 열쇠라서, 아래 목록과 같은 상태를 봐야 한다.
 */
export default function CalendarView({
  tasks,
  picked,
  onPick,
}: {
  tasks: Task[];
  picked: string;
  onPick: (date: string) => void;
}) {
  const [month, setMonth] = useState(thisMonth());

  // 마감일이 없는 옛 할 일은 만든 날의 계획으로 잡는다. planDay가 그 규칙을 갖는다.
  const planned: Record<string, Task[]> = {};
  for (const t of tasks) (planned[planDay(t)] ??= []).push(t);

  const today = todayStr();
  const pickedProgress = dayProgress(planned[picked]);

  return (
    <section>
      <header className="flex items-center justify-between">
        <IconButton onClick={() => setMonth(shiftMonth(month, -1))} label="이전 달">
          <ChevronIcon dir="left" />
        </IconButton>
        <h2 className="text-[15px] font-medium tabular-nums lg:text-lg">{monthLabel(month)}</h2>
        <IconButton onClick={() => setMonth(shiftMonth(month, 1))} label="다음 달">
          <ChevronIcon dir="right" />
        </IconButton>
      </header>

      <div className="mt-3 grid grid-cols-7 text-center text-[13px] lg:mt-5 lg:text-[15px]">
        {WEEKDAYS.map((d) => (
          <div key={d} className="pb-1 text-mute/70 lg:pb-3">
            {d}
          </div>
        ))}

        {monthCells(month).map((date, i) => {
          if (date === null) return <div key={`pad-${i}`} />;
          const isPicked = picked === date;
          const { total, done, ratio } = dayProgress(planned[date]);
          const [, m, d] = date.split('-');

          return (
            <button
              key={date}
              onClick={() => onPick(date)}
              aria-pressed={isPicked}
              // 차오른 높이만으로 뜻을 전하지 않는다. 읽어주는 도구에는 말로 전한다.
              aria-label={`${Number(m)}월 ${Number(d)}일${
                total > 0 ? `, 하려던 일 ${total}개 중 ${done}개 끝냄` : ''
              }`}
              className={`relative flex h-11 w-full items-center justify-center overflow-hidden rounded-xl tabular-nums transition-colors lg:h-16 ${
                isPicked
                  ? 'bg-accent font-medium text-paper'
                  : date === today
                    ? 'font-medium text-accent hover:bg-accent-wash'
                    : 'hover:bg-line/70'
              }`}
            >
              {/* 끝낸 비율만큼 아래에서 차오른다. 덜 찬 날에도 같은 색을 쓴다 —
                  낮은 비율에 경고색을 주면 달력이 못 한 날을 세는 판이 된다. */}
              {!isPicked && ratio > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 bottom-0 bg-done-wash transition-[height]"
                  style={{ height: `${ratio * 100}%` }}
                />
              )}

              <span className="relative -translate-y-[3px] lg:-translate-y-[6px]">{Number(d)}</span>

              {/* 아직 남은 일이 있는 날을 표시한다. 지난 날에 남겨둔 것을
                  목록에서는 볼 수 없으므로, 여기가 그걸 알려주는 유일한 자리다. */}
              {done < total && (
                <span
                  aria-hidden="true"
                  className={`absolute bottom-[6px] h-1 w-1 rounded-full lg:bottom-[13px] lg:h-1.5 lg:w-1.5 ${
                    isPicked ? 'bg-paper' : 'bg-accent'
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>

      {pickedProgress.total > 0 && (
        <p
          className={`mt-3 text-center text-[13px] lg:mt-5 ${
            pickedProgress.done === pickedProgress.total ? 'text-accent' : 'text-mute'
          }`}
        >
          {pickedProgress.done === pickedProgress.total
            ? '계획한 일을 모두 끝낸 날이에요.'
            : `하려던 일 ${pickedProgress.total}개 중 ${pickedProgress.done}개 끝냈어요.`}
        </p>
      )}
    </section>
  );
}
