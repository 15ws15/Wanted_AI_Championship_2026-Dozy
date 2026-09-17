import { GoogleGenAI } from '@google/genai';

const MODEL = 'gemini-3.5-flash-lite';
const TIMEOUT_MS = 10_000;

class TimeoutError extends Error {}

export async function ask(prompt: string, maxTokens = 256): Promise<string> {
  const call = new GoogleGenAI({}).interactions.create({
    model: MODEL,
    input: prompt,
    // Free tier trains on stored traffic; these are the user's own to-dos.
    store: false,
    // One short action sentence needs no reasoning budget, and latency is the product.
    generation_config: { max_output_tokens: maxTokens, thinking_level: 'minimal' },
  });

  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new TimeoutError()), TIMEOUT_MS);
  });

  try {
    const res = await Promise.race([call, timeout]);
    return (res.output_text ?? '').trim();
  } finally {
    clearTimeout(timer);
  }
}

export function llmError(e: unknown): Response {
  console.error('[llm]', e);

  if (e instanceof TimeoutError) {
    return Response.json({ error: '응답이 좀 늦네요. 다시 눌러 주세요.' }, { status: 504 });
  }
  // Free tier has a shared daily ceiling — say so plainly instead of "failed".
  const status = (e as { status?: number })?.status;
  if (status === 429 || String(e).includes('RESOURCE_EXHAUSTED')) {
    return Response.json({ error: '오늘 AI 사용량을 다 썼어요. 내일 다시 만나 주세요.' }, { status: 429 });
  }
  return Response.json({ error: 'AI 호출에 실패했어요. 잠시 후 다시 시도해 주세요.' }, { status: 502 });
}
