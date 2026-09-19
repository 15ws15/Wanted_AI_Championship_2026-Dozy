// node lib/date.test.ts
import assert from 'node:assert';
import {
  dayLabel,
  dueLabel,
  dayProgress,
  localDay,
  planDay,
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

// --- 로컬 날짜 변환 ---
// UTC 문자열을 그냥 자르면 한국 시간 새벽에 끝낸 일이 전날로 간다.
// 이 검사는 실행 환경의 시간대를 따르므로, 자정 근처 시각을 로컬로 되짚어 맞춘다.
const midnightish = new Date(2026, 8, 19, 0, 30);        // 로컬 9/19 00:30
assert.strictEqual(localDay(midnightish.toISOString()), '2026-09-19');
const lateNight = new Date(2026, 8, 19, 23, 30);         // 로컬 9/19 23:30
assert.strictEqual(localDay(lateNight.toISOString()), '2026-09-19');
// 로컬로 만든 시각은 몇 시든 그 날짜로 돌아와야 한다
for (const h of [0, 1, 8, 12, 18, 23]) {
  const d = new Date(2026, 0, 31, h, 0);
  assert.strictEqual(localDay(d.toISOString()), '2026-01-31', `${h}시에서 날짜가 밀렸다`);
}

// --- 어느 날의 계획인가 ---
const made = new Date(2026, 8, 19, 9, 0).toISOString();
// 마감일을 적었으면 그 날
assert.strictEqual(planDay({ dueDate: '2026-09-25', createdAt: made }), '2026-09-25');
// 안 적었으면 만든 날 (첫 화면이 "오늘 할 일"이므로)
assert.strictEqual(planDay({ dueDate: null, createdAt: made }), '2026-09-19');

console.log('date.ts ok');
