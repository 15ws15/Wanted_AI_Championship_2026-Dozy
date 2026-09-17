import { GoogleGenAI } from '@google/genai';

const MODEL = 'gemini-3.5-flash-lite';
const TIMEOUT_MS = 10_000;

class TimeoutError extends Error {}

export async function ask(system: string, input: string, maxTokens = 1024): Promise<string> {
  const call = new GoogleGenAI({}).interactions.create({
    model: MODEL,
    system_instruction: system,
    input,
    // Free tier trains on stored traffic; these are the user's own to-dos.
    store: false,
    // thinking tokens share max_output_tokens — a 256 budget truncated answers mid-word
    // and oneLine() then returned a fragment of the reasoning. Budget covers both now.
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

// The prompt is the real fix for leaked prefixes, but a free-tier model slips
// occasionally and the answer is always the last line. Never show the leak to a user.
export function oneLine(raw: string): string {
  const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean);
  const last = lines[lines.length - 1] ?? '';
  return last
    .replace(/^(할 일|답|행동|출력)\s*[:：]\s*/, '')
    .replace(/^[-*→>\s"']+/, '')
    .replace(/["'\s]+$/, '')
    .trim();
}

export function llmError(e: unknown): Response {
  console.error('[llm]', e);

  if (e instanceof TimeoutError) {
    return Response.json({ error: '응답이 좀 늦네요. 다시 눌러 주세요.' }, { status: 504 });
  }
  // Free tier caps requests per minute AND per day. Google tells us which by how long
  // it asks us to wait — a short wait is a burst, a long one means the day is done.
  const status = (e as { status?: number })?.status;
  if (status === 429 || String(e).includes('RESOURCE_EXHAUSTED')) {
    const retryAfter = String(e).match(/retry in ([\d.]+)s/);
    const wait = retryAfter ? Math.ceil(Number(retryAfter[1])) : null;
    return Response.json(
      {
        error:
          wait && wait <= 120
            ? `요청이 잠깐 몰렸어요. ${wait}초 뒤에 다시 눌러 주세요.`
            : '오늘 AI 사용량을 다 썼어요. 내일 다시 만나 주세요.',
      },
      { status: 429 },
    );
  }
  return Response.json({ error: 'AI 호출에 실패했어요. 잠시 후 다시 시도해 주세요.' }, { status: 502 });
}
