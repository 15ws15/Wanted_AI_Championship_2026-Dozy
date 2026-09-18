// node lib/storage.test.ts
// localStorage가 망가져도 앱이 뜨는지 확인한다. 개발자도구로 손으로 깨뜨려보는
// 검사를 코드로 옮긴 것이다 — 손으로 하면 다음에 또 잊는다.
import assert from 'node:assert';
import { loadTasks, saveTasks } from './storage.ts';

let store: Record<string, string> = {};
const fake = {
  getItem: (k: string) => (k in store ? store[k] : null),
  setItem: (k: string, v: string) => {
    store[k] = v;
  },
};
(globalThis as { localStorage?: unknown }).localStorage = fake;

const KEY = 'dozy.tasks';
const valid = {
  id: 'a',
  title: '보고서 작성',
  createdAt: '2026-09-19T00:00:00.000Z',
  dueDate: null,
  completedAt: null,
  steps: [],
};

// 아무것도 없을 때
store = {};
assert.deepStrictEqual(loadTasks(), []);

// 정상 왕복
store = {};
saveTasks([valid as never]);
assert.strictEqual(loadTasks().length, 1);
assert.strictEqual(loadTasks()[0].title, '보고서 작성');

// 개발자도구에서 사람이 주입할 법한 쓰레기들
for (const junk of [
  'not json at all',
  '{"broken": ',
  'null',
  '42',
  '"문자열"',
  '{"tasks":[]}', // 배열이 아니라 객체
  '[',
]) {
  store = { [KEY]: junk };
  assert.deepStrictEqual(loadTasks(), [], `깨진 값에서 빈 배열이 아님: ${junk}`);
}

// 배열이지만 항목이 Task가 아닌 경우 — 성한 것만 남고 앱은 계속 뜬다
store = { [KEY]: JSON.stringify([valid, null, 42, '문자열', {}, { id: 'x' }, valid]) };
const survived = loadTasks();
assert.strictEqual(survived.length, 2, '성한 항목만 살아남아야 한다');
assert.ok(survived.every((t) => typeof t.title === 'string' && Array.isArray(t.steps)));

// steps가 배열이 아니면 렌더에서 .map이 터진다. 걸러져야 한다.
store = { [KEY]: JSON.stringify([{ ...valid, steps: '배열아님' }]) };
assert.deepStrictEqual(loadTasks(), []);

// localStorage 자체가 던지는 환경(시크릿 모드, 저장소 차단)
(globalThis as { localStorage?: unknown }).localStorage = {
  getItem: () => {
    throw new Error('SecurityError');
  },
  setItem: () => {
    throw new Error('QuotaExceededError');
  },
};
assert.deepStrictEqual(loadTasks(), [], '읽기가 던져도 빈 배열이어야 한다');
saveTasks([valid as never]); // 던지면 안 된다

console.log('storage.ts ok');
