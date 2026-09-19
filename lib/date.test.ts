// node lib/date.test.ts
import assert from 'node:assert';
import {
  dayLabel,
  dueLabel,
  groupByDay,
  dayProgress,
  monthCells,
  monthLabel,
  shiftMonth,
  todayStr,
} from './date.ts';

const shift = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

assert.strictEqual(todayStr(), shift(0));
assert.deepStrictEqual(dueLabel(shift(-1)), { text: '지났어요', urgent: true });
assert.deepStrictEqual(dueLabel(shift(0)), { text: '오늘까지', urgent: true });
assert.deepStrictEqual(dueLabel(shift(1)), { text: '내일까지', urgent: true });
assert.strictEqual(dueLabel(shift(30)).urgent, false);
assert.deepStrictEqual(dueLabel('2099-01-05'), { text: '~1/5', urgent: false });
assert.deepStrictEqual(dueLabel('2099-12-25'), { text: '~12/25', urgent: false });

// shiftDays가 기대는 전제: setDate 넘김이 월/연 경계를 넘어간다.
// 이게 깨지면 1월 31일에 "내일까지"가 영원히 안 뜬다.
const jan31 = new Date(2024, 0, 31);
jan31.setDate(jan31.getDate() + 1);
assert.strictEqual(`${jan31.getMonth()}/${jan31.getDate()}`, '1/1');
const dec31 = new Date(2024, 11, 31);
dec31.setDate(dec31.getDate() + 1);
assert.strictEqual(`${dec31.getFullYear()}/${dec31.getMonth()}`, '2025/0');

// --- 달력 ---
// 2026-09-01은 화요일 → 앞에 일·월 두 칸이 빈다
const sep = monthCells({ year: 2026, month: 9 });
assert.strictEqual(sep.length, 2 + 30);
assert.deepStrictEqual(sep.slice(0, 3), [null, null, '2026-09-01']);
assert.strictEqual(sep[sep.length - 1], '2026-09-30');

// 윤년 2월은 29일, 평년은 28일
assert.strictEqual(monthCells({ year: 2024, month: 2 }).filter(Boolean).length, 29);
assert.strictEqual(monthCells({ year: 2025, month: 2 }).filter(Boolean).length, 28);

// 1일이 일요일이면 앞이 비지 않는다 (2026-02-01은 일요일)
assert.strictEqual(monthCells({ year: 2026, month: 2 })[0], '2026-02-01');

// 모든 칸은 그 달에 속하고 형식이 일정하다 — 달력 칸을 눌러 조회할 키가 되므로 어긋나면 안 된다
for (const c of monthCells({ year: 2026, month: 3 })) {
  if (c) assert.match(c, /^2026-03-\d{2}$/);
}

// 연 경계를 넘는 이동
assert.deepStrictEqual(shiftMonth({ year: 2026, month: 12 }, 1), { year: 2027, month: 1 });
assert.deepStrictEqual(shiftMonth({ year: 2026, month: 1 }, -1), { year: 2025, month: 12 });
assert.deepStrictEqual(shiftMonth({ year: 2026, month: 6 }, 0), { year: 2026, month: 6 });
assert.strictEqual(monthLabel({ year: 2026, month: 9 }), '2026년 9월');

// --- 지난 기록 머리말 ---
assert.strictEqual(dayLabel(shift(0)), '오늘');
assert.strictEqual(dayLabel(shift(-1)), '어제');
assert.strictEqual(dayLabel('2020-03-07'), '2020년 3월 7일');

// --- 지난 기록 그룹핑 ---
type C = { id: string; at: string };
const done: C[] = [
  { id: 'c', at: '2026-09-18T20:00:00.000Z' },
  { id: 'b', at: '2026-09-18T09:00:00.000Z' },
  { id: 'a', at: '2026-09-17T09:00:00.000Z' },
];
const g = groupByDay(done, (t) => t.at.slice(0, 10));
assert.strictEqual(g.length, 2);
assert.deepStrictEqual(g[0][0], '2026-09-18');
assert.deepStrictEqual(g[0][1].map((t) => t.id), ['c', 'b']);
assert.deepStrictEqual(g[1][1].map((t) => t.id), ['a']);
assert.deepStrictEqual(groupByDay([] as C[], (t) => t.at), []);

// 같은 날짜가 떨어져 들어오면 따로 묶인다 — 정렬을 건너뛰면 안 된다는 뜻이다
const unsorted: C[] = [
  { id: 'x', at: '2026-09-18T01:00:00.000Z' },
  { id: 'y', at: '2026-09-17T01:00:00.000Z' },
  { id: 'z', at: '2026-09-18T02:00:00.000Z' },
];
assert.strictEqual(groupByDay(unsorted, (t) => t.at.slice(0, 10)).length, 3);

// --- 그 날 마감인 일의 진행 정도 ---
const at = '2026-09-19T10:00:00.000Z';

// 마감이 하나도 없는 날은 채울 것이 없다. every는 빈 배열에 true를 주므로
// 이 경우를 따로 보지 않으면 달력의 빈 날이 전부 가득 찬 것으로 칠해진다.
assert.deepStrictEqual(dayProgress(undefined), { total: 0, done: 0, ratio: 0 });
assert.deepStrictEqual(dayProgress([]), { total: 0, done: 0, ratio: 0 });

assert.deepStrictEqual(dayProgress([{ completedAt: at }]), { total: 1, done: 1, ratio: 1 });
assert.deepStrictEqual(dayProgress([{ completedAt: null }]), { total: 1, done: 0, ratio: 0 });

// 4개 중 2개 → 절반
const four = [{ completedAt: at }, { completedAt: at }, { completedAt: null }, { completedAt: null }];
assert.deepStrictEqual(dayProgress(four), { total: 4, done: 2, ratio: 0.5 });

// 나누어떨어지지 않아도 0과 1 사이에 머문다
const third = dayProgress([{ completedAt: at }, { completedAt: null }, { completedAt: null }]);
assert.ok(third.ratio > 0 && third.ratio < 1);
assert.strictEqual(Math.round(third.ratio * 100), 33);

console.log('date.ts ok');
