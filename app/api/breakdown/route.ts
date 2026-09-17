import { badTitle, fail, rateLimited } from '@/lib/api';
import { ask, llmError, oneLine } from '@/lib/llm';
import { BREAKDOWN_SYSTEM, breakdownInput } from '@/lib/prompts';

export async function POST(req: Request) {
  if (rateLimited(req)) return fail('오늘은 여기까지만 도와드릴 수 있어요. 한 시간 뒤에 다시 만나요.', 429);

  const { title } = await req.json().catch(() => ({ title: null }));
  if (badTitle(title)) return fail('할 일 내용을 확인해 주세요.', 400);

  try {
    return Response.json({ step: oneLine(await ask(BREAKDOWN_SYSTEM, breakdownInput(title))) });
  } catch (e) {
    return llmError(e);
  }
}
