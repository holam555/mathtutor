/**
 * Minimal in-memory sliding-window rate limiter for the public assessment
 * API routes (unauthenticated by design, but each submit invokes Gemini —
 * a cost-abuse vector; see docs/audit_2026-07.md).
 *
 * Honest limitation: state lives per serverless instance, so on Vercel a
 * determined attacker spread across cold starts can exceed the limit.
 * This still stops the realistic abuse case — a naive loop hammering a
 * warm instance — at zero infra cost. If real abuse appears, upgrade to
 * Vercel WAF rules or an Upstash-backed limiter.
 */

type Window = number[] // request timestamps (ms)

const buckets = new Map<string, Window>()

// Cap total tracked keys so a scan across many IPs can't grow memory unbounded.
const MAX_KEYS = 10_000

export function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number }
): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now()
  const cutoff = now - windowMs

  let hits = buckets.get(key)
  if (!hits) {
    if (buckets.size >= MAX_KEYS) buckets.clear()
    hits = []
    buckets.set(key, hits)
  }

  // Drop entries outside the window, in place.
  let firstValid = 0
  while (firstValid < hits.length && hits[firstValid] <= cutoff) firstValid++
  if (firstValid > 0) hits.splice(0, firstValid)

  if (hits.length >= limit) {
    const retryAfterSeconds = Math.ceil((hits[0] + windowMs - now) / 1000)
    return { allowed: false, retryAfterSeconds }
  }

  hits.push(now)
  return { allowed: true, retryAfterSeconds: 0 }
}

/** Client IP from proxy headers (Vercel sets x-forwarded-for). */
export function clientIp(request: Request): string {
  const fwd = request.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim()
  return request.headers.get('x-real-ip') ?? 'unknown'
}
