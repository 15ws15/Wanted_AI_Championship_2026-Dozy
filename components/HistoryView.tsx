'use client';

import { dayLabel, groupByDay, localDay } from '@/lib/date';
import type { Task } from '@/types';

export default function HistoryView({ tasks }: { tasks: Task[] }) {
  const done = tasks
    .filter((t) => t.completedAt)
    .sort((a, b) => (a.completedAt! < b.completedAt! ? 1 : -1));

  // UTC 문자열을 그냥 자르면 새벽에 끝낸 일이 전날 묶음으로 간다.
  const groups = groupByDay(done, (t) => localDay(t.completedAt!));

  if (groups.length === 0) {
    return (
      <p className="mt-10 text-sm leading-loose text-mute">
        아직 끝낸 일이 없어요.
        <br />
        하나 끝내면 여기에 날짜별로 쌓입니다.
      </p>
    );
  }

  return (
    <section className="mt-6 space-y-7">
      {groups.map(([day, items]) => (
        <div key={day}>
          <h2 className="text-[13px] font-medium text-mute">{dayLabel(day)}</h2>
          <ul className="mt-3 space-y-3">
            {items.map((t) => (
              <li key={t.id} className="text-sm leading-relaxed">
                {t.title}
                {t.steps.length > 0 && (
                  <span className="ml-2 text-[13px] text-mute">
                    {t.steps.length}단계로 쪼갬
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
