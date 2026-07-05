import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Question images are stored as RAW storage paths in the `past-papers`
 * bucket (see admin/questions/actions.ts and the approval flows) because
 * signed URLs expire. Every display surface must sign at render time.
 *
 * Accepts either a raw path or an already-usable https URL (legacy seed
 * rows store public URLs) and returns something an <img> can load.
 */
export async function signQuestionImage(
  service: SupabaseClient,
  pathOrUrl: string | null | undefined,
  expiresInSeconds = 3600
): Promise<string | null> {
  if (!pathOrUrl) return null
  if (pathOrUrl.startsWith('https://') || pathOrUrl.startsWith('http://')) return pathOrUrl
  const { data } = await service.storage
    .from('past-papers')
    .createSignedUrl(pathOrUrl, expiresInSeconds)
  return data?.signedUrl ?? null
}
