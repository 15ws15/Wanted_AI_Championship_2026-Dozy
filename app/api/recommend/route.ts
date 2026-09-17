import { fail, rateLimited } from '@/lib/api';
import { askJson, llmError } from '@/lib/llm';
import { RECOMMEND_SCHEMA, RECOMMEND_SYSTEM, recommendInput } from '@/lib/prompts';

export async function POST(req: Request) {
  if (rateLimited(req)) return fail('오늘은 여기까지만 도와드릴 수 있어요. 한 시간 뒤에 다시 만나요.', 429);

  const { titles } = await req.json().catch(() => ({ titles: null }));
  const ok =
    Array.isArray(titles) &&
    titles.length > 0 &&
    titles.length <= 50 &&
    titles.every((t) => typeof t === 'string' && t.trim() && t.length <= 200);
  if (!ok) return fail('할 일 목록을 확인해 주세요.', 400);

  try {
    const got = await askJson<{ index: number; reason: string }>(
      RECOMMEND_SYSTEM,
      recommendInput(titles),
      RECOMMEND_SCHEMA,
    );
    // 모델이 범위 밖 번호를 주면 첫 항목으로 폴백한다. 절대 크래시하지 않는다. (§5.4)
    const index = Number.isInteger(got?.index) && got.index >= 1 && got.index <= titles.length ? got.index - 1 : 0;
    const reason = typeof got?.reason === 'string' ? got.reason.trim().slice(0, 40) : '';
    return Response.json({ index, reason });
  } catch (e) {
    // JSON이 깨졌어도 추천 자체는 돌려준다 — 이유만 비운다.
    if (e instanceof SyntaxError) return Response.json({ index: 0, reason: '' });
    return llmError(e);
  }
}
