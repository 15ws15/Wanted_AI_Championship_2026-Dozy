// 모든 비교는 YYYY-MM-DD 문자열로 한다. Date 객체 비교는 타임존 버그의 원인이다. (§4.2)

function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
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
