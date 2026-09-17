import { badTitle, fail, rateLimited } from '@/lib/api';
import { ask, llmError, oneLine } from '@/lib/llm';
import { BREAKDOWN_MORE_SYSTEM, breakdownMoreInput } from '@/lib/prompts';

export async function POST(req: Request) {
  if (rateLimited(req)) return fail('오늘은 여기까지만 도와드릴 수 있어요. 한 시간 뒤에 다시 만나요.', 429);

  const { title, previousStep } = await req.json().catch(() => ({ title: null, previousStep: null }));
  if (badTitle(title) || badTitle(previousStep)) return fail('할 일 내용을 확인해 주세요.', 400);

  try {
    return Response.json({ step: oneLine(await ask(BREAKDOWN_MORE_SYSTEM, breakdownMoreInput(title, previousStep))) });
  } catch (e) {
    return llmError(e);
  }
}
