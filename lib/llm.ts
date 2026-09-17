import Anthropic from '@anthropic-ai/sdk';

export async function ask(prompt: string, maxTokens = 256): Promise<string> {
  const res = await new Anthropic().messages.create(
    {
      model: 'claude-haiku-4-5',
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    },
    // TS SDK timeout is milliseconds. maxRetries 0 so 10s stays 10s wall-clock.
    { timeout: 10_000, maxRetries: 0 },
  );
  return res.content
    .map((b) => (b.type === 'text' ? b.text : ''))
    .join('')
    .trim();
}

export function llmError(e: unknown): Response {
  const timedOut = e instanceof Anthropic.APIConnectionTimeoutError;
  console.error('[llm]', e);
  return Response.json(
    { error: timedOut ? '응답이 좀 늦네요. 다시 눌러 주세요.' : 'AI 호출에 실패했어요. 잠시 후 다시 시도해 주세요.' },
    { status: timedOut ? 504 : 502 },
  );
}
