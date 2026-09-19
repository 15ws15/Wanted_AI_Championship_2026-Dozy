const MAX_OUTPUT_LENGTH = 200;

function text(value: unknown) {
  return typeof value === 'string' ? value.trim().slice(0, MAX_OUTPUT_LENGTH) : '';
}

function timeoutMs() {
  const value = Number(process.env.ZERO_GPU_TIMEOUT_MS ?? 10_000);
  return Number.isFinite(value) ? Math.min(Math.max(value, 1_000), 10_000) : 10_000;
}

async function withTimeout<T>(work: (signal: AbortSignal) => Promise<T>) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs());
  try {
    return await work(controller.signal);
  } finally {
    clearTimeout(timer);
  }
}

/** Calls the existing HyperCLOVA ZeroGPU Space only after Gemini has failed. */
export async function askZeroGpu(taskTitle: string, previousStep?: string) {
  const baseUrl = process.env.ZERO_GPU_SPACE_URL?.replace(/\/$/, '');
  if (!baseUrl) throw new Error('ZeroGPU is not configured.');

  return withTimeout(async (signal) => {
    const queued = await fetch(`${baseUrl}/gradio_api/call/breakdown`, {
      method: 'POST',
      signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: [taskTitle, '', [taskTitle, previousStep].filter(Boolean).join('\n')] }),
    });
    if (!queued.ok) throw new Error(`ZeroGPU queue failed (${queued.status}).`);

    const queuedBody = (await queued.json()) as { event_id?: unknown };
    const eventId = text(queuedBody.event_id);
    if (!eventId) throw new Error('ZeroGPU returned no event ID.');

    const completed = await fetch(`${baseUrl}/gradio_api/call/breakdown/${eventId}`, { signal });
    if (!completed.ok) throw new Error(`ZeroGPU result failed (${completed.status}).`);

    const lastDataLine = (await completed.text())
      .trim()
      .split('\n')
      .reverse()
      .find((line) => line.startsWith('data:'));
    if (!lastDataLine) throw new Error('ZeroGPU returned no result.');

    const data = JSON.parse(lastDataLine.slice(5).trim()) as unknown;
    const result = text(Array.isArray(data) ? data[0] : data);
    if (!result) throw new Error('ZeroGPU returned an empty result.');
    return result;
  });
}
