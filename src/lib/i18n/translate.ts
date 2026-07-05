import { dict } from './dict'
import type { Lang } from './lang'

/**
 * Chrome-only translation lookup. Keyed by the exact Chinese string.
 * Falls back to the original Chinese if no entry exists, so partial
 * dictionary coverage never breaks rendering.
 */
export function t(zh: string, lang: Lang): string {
  if (lang === 'zh') return zh
  return dict[zh] ?? zh
}
