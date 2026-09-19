// 모든 비교는 YYYY-MM-DD 문자열로 한다. Date 객체 비교는 타임존 버그의 원인이다.

const pad = (n: number) => String(n).padStart(2, '0');

function ymd(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayStr(): string {
  return ymd(new Date());
}

function shiftDays(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return ymd(d);
}

export type Due = { text: string; urgent: boolean };

/** 마감일을 사람이 읽는 라벨로. urgent면 마감이 임박했다는 뜻이다. */
export function dueLabel(dueDate: string): Due {
  const today = todayStr();
  if (dueDate < today) return { text: '지났어요', urgent: true };
  if (dueDate === today) return { text: '오늘까지', urgent: true };
  if (dueDate === shiftDays(1)) return { text: '내일까지', urgent: true };

  const [, m, d] = dueDate.split('-');
  return { text: `~${Number(m)}/${Number(d)}`, urgent: false };
}

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
 * 같은 날짜끼리 이어 묶는다. 입력이 최신순이면 결과도 최신순이다.
 * 날짜를 키로 모으지 않고 인접한 것만 묶는 이유는 정렬 순서를 그대로 보존하기 위해서다.
 */
export function groupByDay<T>(items: T[], dayOf: (t: T) => string): [string, T[]][] {
  const groups: [string, T[]][] = [];
  for (const item of items) {
    const day = dayOf(item);
    const last = groups[groups.length - 1];
    if (last && last[0] === day) last[1].push(item);
    else groups.push([day, [item]]);
  }
  return groups;
}

/**
 * 그 날 마감인 일이 있었고, 하나도 남지 않았는가.
 * 빈 배열에 every는 true를 돌려주므로 "계획이 있었는지"를 먼저 본다.
 * 이 가드가 없으면 마감이 하나도 없는 날까지 전부 완료로 표시된다.
 */
export function isDayCleared(planned: { completedAt: string | null }[] | undefined): boolean {
  return !!planned?.length && planned.every((t) => t.completedAt !== null);
}
