// node lib/date.test.ts
import assert from 'node:assert';
import { dueLabel, todayStr } from './date.ts';

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

// 자릿수 채운 날짜를 사람이 읽는 형태로 줄이되, 월/일을 헷갈리게 바꾸지 않는다
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

console.log('date.ts ok');
