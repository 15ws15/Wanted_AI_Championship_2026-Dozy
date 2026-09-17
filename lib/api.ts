const LIMIT = 30;
const WINDOW_MS = 60 * 60 * 1000;

// ponytail: in-memory per-instance counter, unbounded Map. Serverless instances
// are short-lived so it self-clears; swap for Upstash if this ever runs on one box.
const hits = new Map<string, number[]>();

export function rateLimited(req: Request): boolean {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > LIMIT;
}

export function fail(message: string, status: number): Response {
  return Response.json({ error: message }, { status });
}

export function badTitle(title: unknown): boolean {
  return typeof title !== 'string' || !title.trim() || title.length > 200;
}
