'use client';

import { useState } from 'react';
import IconButton from '@/components/IconButton';
import { ChevronIcon } from '@/components/icons';
import {
  dayProgress,
  localDay,
  monthCells,
  monthLabel,
  planDay,
  shiftMonth,
  thisMonth,
  todayStr,
} from '@/lib/date';
import type { Task } from '@/types';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export default function CalendarView({ tasks }: { tasks: Task[] }) {
  const [month, setMonth] = useState(thisMonth());
  const [picked, setPicked] = useState<string | null>(todayStr());

  // 마감일이 없는 할 일도 만든 날의 계획으로 잡는다. 마감일은 선택 입력이라
  // 대다수가 날짜 없이 쌓이는데, 그것들을 빼면 달력이 실제로 한 일을 반영하지 못한다.
  const planned: Record<string, Task[]> = {};
  const finished: Record<string, Task[]> = {};
  for (const t of tasks) {
    (planned[planDay(t)] ??= []).push(t);
    if (t.completedAt) (finished[localDay(t.completedAt)] ??= []).push(t);
  }

  const progressOn = (date: string) => dayProgress(planned[date]);

  const today = todayStr();
  // 데이터가 없는 날짜를 눌러도 빈 배열을 받는다. 여기서 깨지면 안 된다.
  const pickedPlan = picked ? (planned[picked] ?? []) : [];
  // 그 날 계획이었던 것은 위에 이미 나오므로 뺀다. 한 번만 보이게 한다.
  const pickedDone = picked
    ? (finished[picked] ?? []).filter((t) => planDay(t) !== picked)
    : [];

  return (
    <section className="mt-6">
      <header className="flex items-center justify-between">
        <IconButton onClick={() => setMonth(shiftMonth(month, -1))} label="이전 달">
          <ChevronIcon dir="left" />
        </IconButton>
        <h2 className="text-[15px] font-medium tabular-nums">{monthLabel(month)}</h2>
        <IconButton onClick={() => setMonth(shiftMonth(month, 1))} label="다음 달">
          <ChevronIcon dir="right" />
        </IconButton>
      </header>

      <div className="mt-3 grid grid-cols-7 text-center text-[13px]">
        {WEEKDAYS.map((d) => (
          <div key={d} className="pb-1 text-mute/70">
            {d}
          </div>
        ))}

        {monthCells(month).map((date, i) => {
          if (date === null) return <div key={`pad-${i}`} />;
          const isPicked = picked === date;
          const { total, done, ratio } = progressOn(date);
          const [, m, d] = date.split('-');

          return (
            <button
              key={date}
              onClick={() => setPicked(date)}
              aria-pressed={isPicked}
              // 차오른 높이만으로 뜻을 전하지 않는다. 읽어주는 도구에는 말로 전한다.
              aria-label={`${Number(m)}월 ${Number(d)}일${
                total > 0 ? `, 하려던 일 ${total}개 중 ${done}개 끝냄` : ''
              }`}
              className={`relative flex h-11 w-full items-center justify-center overflow-hidden rounded-xl tabular-nums transition-colors ${
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

              <span className="relative -translate-y-[3px]">{Number(d)}</span>

              {/* 점은 "여기 뭔가 있다"는 표시일 뿐이다. 마감인지 끝낸 일인지는
                  아래 목록이 글자로 말한다. */}
              <span className="absolute bottom-[6px] flex gap-[3px]">
                {done < total && (
                  <span
                    aria-hidden="true"
                    className={`h-1 w-1 rounded-full ${isPicked ? 'bg-paper' : 'bg-accent'}`}
                  />
                )}
                {finished[date] && (
                  <span
                    aria-hidden="true"
                    className={`h-1 w-1 rounded-full border ${
                      isPicked ? 'border-paper' : 'border-mute'
                    }`}
                  />
                )}
              </span>
            </button>
          );
        })}
      </div>

      {picked && (
        <div className="mt-5 border-t border-line pt-4">
          {pickedPlan.length === 0 && pickedDone.length === 0 ? (
            <p className="text-sm text-mute">이 날은 비어 있어요.</p>
          ) : (
            <div className="space-y-5">
              {progressOn(picked).total > 0 && <DayProgressNote {...progressOn(picked)} />}
              <DayGroup label="이 날 하려던 일" items={pickedPlan} />
              <DayGroup label="이 날 끝낸 다른 일" items={pickedDone} />
            </div>
          )}
        </div>
      )}
    </section>
  );
}

/** 숫자는 사실만 적는다. 퍼센트나 점수로 바꾸지 않는다. */
function DayProgressNote({ total, done }: { total: number; done: number }) {
  return (
    <p className={`text-[13px] ${done === total ? 'text-accent' : 'text-mute'}`}>
      {done === total ? '계획한 일을 모두 끝낸 날이에요.' : `마감 ${total}개 중 ${done}개 끝냈어요.`}
    </p>
  );
}

function DayGroup({ label, items }: { label: string; items: Task[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <h3 className="text-[13px] text-mute">{label}</h3>
      <ul className="mt-2 space-y-2">
        {items.map((t) => (
          <li
            key={t.id}
            className={`text-sm leading-relaxed ${t.completedAt ? 'text-mute line-through' : ''}`}
          >
            {t.title}
          </li>
        ))}
      </ul>
    </div>
  );
}
