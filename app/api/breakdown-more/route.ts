import { badTitle, fail, rateLimited } from '@/lib/api';
import { ask, llmError, oneLine } from '@/lib/llm';
import { BREAKDOWN_MORE_SYSTEM, breakdownMoreInput } from '@/lib/prompts';
import { askZeroGpu } from '@/lib/zero-gpu';

// LLM 응답을 기다리는 함수다. 프로젝트 기본값이 낮게 잡혀도 끊기지 않도록 명시한다.
export const maxDuration = 30;

export async function POST(req: Request) {
  if (rateLimited(req)) return fail('오늘은 여기까지만 도와드릴 수 있어요. 한 시간 뒤에 다시 만나요.', 429);

  const { title, previousStep } = await req.json().catch(() => ({ title: null, previousStep: null }));
  if (badTitle(title) || badTitle(previousStep)) return fail('할 일 내용을 확인해 주세요.', 400);

  try {
    return Response.json({ step: oneLine(await ask(BREAKDOWN_MORE_SYSTEM, breakdownMoreInput(title, previousStep))) });
  } catch (geminiError) {
    try {
      return Response.json({ step: oneLine(await askZeroGpu(title, previousStep)) });
    } catch {
      return llmError(geminiError);
    }
  }
}
