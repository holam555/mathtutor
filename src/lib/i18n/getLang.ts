import { cookies } from 'next/headers'
import { LANG_COOKIE, type Lang } from './lang'

/** Server-only: reads the language preference cookie. Defaults to Chinese. */
export function getLang(): Lang {
  return cookies().get(LANG_COOKIE)?.value === 'en' ? 'en' : 'zh'
}
