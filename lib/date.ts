// 모든 비교는 YYYY-MM-DD 문자열로 한다. Date 객체 비교는 타임존 버그의 원인이다.

const pad = (n: number) => String(n).padStart(2, '0');

function ymd(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayStr(): string {
  return ymd(new Date());
}

/**
 * YYYY-MM-DD에서 n일 뒤. 문자열로 받아 문자열로 돌려준다.
 * 월말·연말 넘김은 Date에 맡긴다 — 12월 31일 다음이 1월 1일이 되는 계산을
 * 직접 짜면 윤년과 월별 일수를 다시 구현하게 된다.
 */
export function addDays(dateStr: string, n: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return ymd(new Date(y, m - 1, d + n));
}

const shiftDays = (n: number) => addDays(todayStr(), n);

export type Month = { year: number; month: number };

export function thisMonth(): Month {
  const d = new Date();
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

/** 월을 앞뒤로 옮긴다. 12월 다음은 다음 해 1월이다. */
export function shiftMonth({ year, month }: Month, delta: number): Month {
  const d = new Date(year, month - 1 + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

export const monthLabel = ({ year, month }: Month) => `${year}년 ${month}월`;

/**
 * 월간 그리드 칸. 1일이 무슨 요일이든 열이 맞도록 앞을 null로 채운다.
 * 뒤는 채우지 않는다 — 빈 칸을 그릴 이유가 없다.
 */
export function monthCells({ year, month }: Month): (string | null)[] {
  const lead = new Date(year, month - 1, 1).getDay();
  const days = new Date(year, month, 0).getDate();
  const cells: (string | null)[] = Array(lead).fill(null);
  for (let d = 1; d <= days; d++) cells.push(`${year}-${pad(month)}-${pad(d)}`);
  return cells;
}

/** 지난 기록의 날짜 머리말. 가까운 날은 이름으로 부른다. */
export function dayLabel(dateStr: string): string {
  if (dateStr === todayStr()) return '오늘';
  if (dateStr === shiftDays(-1)) return '어제';
  const [y, m, d] = dateStr.split('-');
  const sameYear = y === todayStr().slice(0, 4);
  return sameYear ? `${Number(m)}월 ${Number(d)}일` : `${y}년 ${Number(m)}월 ${Number(d)}일`;
}

/**
 * 그 날 계획이었던 일 중 몇 개가 끝났는가. 달력 칸이 차오르는 높이가 된다.
 * total이 0이면 계획이 없던 날이다 — 채울 것도, 못 채운 것도 없다.
 *
 * 빈 배열에 every는 true를 돌려주므로 "계획이 있었는지"를 먼저 봐야 한다.
 * 그 가드가 없으면 계획이 하나도 없는 날까지 전부 가득 찬 것으로 칠해진다.
 */
export function dayProgress(planned: { completedAt: string | null }[] | undefined): {
  total: number;
  done: number;
  ratio: number;
} {
  const total = planned?.length ?? 0;
  const done = planned?.filter((t) => t.completedAt !== null).length ?? 0;
  return { total, done, ratio: total === 0 ? 0 : done / total };
}

/**
 * ISO 시각을 사용자 로컬 기준 YYYY-MM-DD로 바꾼다.
 * toISOString()은 UTC라 문자열을 그냥 잘라 쓰면 한국 시간 새벽에 끝낸 일이
 * 전날로 기록된다. 저장은 ISO로 하되 날짜로 묶을 때는 반드시 이걸 거친다.
 */
export function localDay(iso: string): string {
  return ymd(new Date(iso));
}

/**
 * 그 할 일이 어느 날의 계획이었는가.
 * 마감일을 적었으면 그 날, 안 적었으면 만든 날이다 — 첫 화면이 "오늘 할 일"이므로
 * 날짜 없이 적은 것은 그 날 하려던 일로 본다.
 *
 * 완료한 날이 아니라 계획한 날에 묶는 이유는 칸이 흔들리지 않게 하기 위해서다.
 * 완료일 기준이면 묵혀둔 일을 끝낼 때마다 지난 칸들이 다시 그려진다.
 */
export function planDay(task: { dueDate: string | null; createdAt: string }): string {
  return task.dueDate ?? localDay(task.createdAt);
}

/**
 * 이 날의 일을 어디로 옮길 수 있는가.
 * 지난 날에 남은 것은 오늘로 끌어오고, 오늘 버거운 것은 내일로 미룬다.
 * 앞날의 일은 이미 계획된 자리에 있으므로 옮길 곳을 주지 않는다.
 *
 * 자동으로 옮기지 않는 이유는, 미룬 일이 매일 따라다니면 그 자체가 압박이 되어서다.
 */
export function rescheduleTarget(day: string): { label: string; to: string } | null {
  const today = todayStr();
  if (day < today) return { label: '오늘 하기', to: today };
  if (day === today) return { label: '내일 하기', to: addDays(today, 1) };
  return null;
}
