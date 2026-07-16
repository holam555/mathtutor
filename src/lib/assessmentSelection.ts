// Question selection algorithm for the P3–P6 assessments.
//
// Even (uniform) distribution across the units/topics the parent selected,
// then fill the per-tier quota (TIER_QUOTA = 10/8/2 = 20, all grades).
//
// Tier quota is supplied by the caller — defaults to TIER_QUOTA.
//
// Minimum coverage: every selected scope gets at least 1 question. If the
// base 20-question budget cannot cover all scopes, up to MAX_TOTAL extra
// questions are added (one per empty scope, any tier, basic preferred).
//
// Group handling: rows sharing the same `group_id` are linked sub-questions.
// They are always pulled as a unit and count as ONE quota slot. The group's
// difficulty_tier is taken from sub_order=1 (rows in a group share a tier).

import type { DifficultyTier } from '@/types/assessment'
import { TIER_QUOTA } from '@/types/assessment'
import { shuffleInPlace } from '@/lib/shuffle'

// ── Inputs/outputs ────────────────────────────────────────────────────────

export type SelectionScope = {
  id: string
  display_order: number
  topic_ids: string[]    // For unit-mode: all topic ids under this unit.
                         // For topic-mode: [thisTopicId]. Used to filter the candidate pool.
}

export type CandidateRow = {
  id: string
  topic_id: string
  difficulty_tier: DifficultyTier
  group_id: string | null
  sub_order: number
}

// ── Internal: collapse rows into selectable items ──────────────────────────

type CandidateItem = {
  // A "selectable item" is either a standalone question (one row) or a group
  // of linked sub-questions that must be served together as one quota slot.
  key: string                   // group_id, or `solo:${row.id}` for standalones
  rows: CandidateRow[]          // length 1 for standalone, ≥1 for group
  difficulty_tier: DifficultyTier
  // For weighting: which scope does this item belong to? (Use the topic of
  // the first row to decide. Sub-questions in a group share the same topic.)
  scopeIdx: number
}

function buildCandidateItems(
  rows: CandidateRow[],
  scopes: SelectionScope[],
): CandidateItem[] {
  // Map topic_id → scope index (smallest matching scope wins; standard case
  // each topic only appears in one scope so no overlap concern).
  const topicToScope = new Map<string, number>()
  scopes.forEach((scope, idx) => {
    for (const tid of scope.topic_ids) {
      if (!topicToScope.has(tid)) topicToScope.set(tid, idx)
    }
  })

  // Bucket rows by group_id (or unique solo key)
  const groupBuckets = new Map<string, CandidateRow[]>()
  for (const r of rows) {
    const key = r.group_id ?? `solo:${r.id}`
    if (!groupBuckets.has(key)) groupBuckets.set(key, [])
    groupBuckets.get(key)!.push(r)
  }

  const items: CandidateItem[] = []
  for (const [key, groupRows] of Array.from(groupBuckets.entries())) {
    // Sort sub-questions by sub_order so display order is stable
    groupRows.sort((a: CandidateRow, b: CandidateRow) => a.sub_order - b.sub_order)
    const first = groupRows[0]
    const scopeIdx = topicToScope.get(first.topic_id)
    if (scopeIdx === undefined) continue   // row is for a topic the parent didn't pick — skip
    items.push({
      key,
      rows: groupRows,
      difficulty_tier: first.difficulty_tier,
      scopeIdx,
    })
  }

  return items
}

// ── Per-tier quota allocation across scopes (uniform / even distribution) ───
//
// Each selected scope gets the same allocation (floor), with the remainder
// distributed to the first (remainder) scopes. e.g. quota=10, 3 scopes →
// [4, 3, 3]. Earlier scopes (smaller display_order) get the extra in tied cases.
//
// Previously this used dampened linear weighting (last scope got up to 2×
// the first). Switched to even distribution to keep the algorithm simple
// and predictable across both P3 and P5; safety nets below (neighbour
// borrow + cross-tier fill + gap-fill) handle thin scopes.

const MAX_TOTAL = 30         // hard ceiling; extra slots used only to guarantee ≥1 per scope

function allocateByEvenDist(
  scopeCount: number,
  totalQuota: number,
): number[] {
  if (scopeCount <= 0) return []
  const base = Math.floor(totalQuota / scopeCount)
  const remainder = totalQuota - base * scopeCount
  return Array.from({ length: scopeCount }, (_, i) =>
    base + (i < remainder ? 1 : 0),
  )
}

// ── Main selection ────────────────────────────────────────────────────────

export type SelectionResult = {
  selectedItems: CandidateItem[]    // ordered by tier (basic → enhancement → advanced) then by scope display order
  perTierActual: Record<DifficultyTier, number>
  warnings: string[]
}

export function selectQuestions(
  rows: CandidateRow[],
  scopes: SelectionScope[],
  tierQuota: Record<DifficultyTier, number> = TIER_QUOTA,
): SelectionResult {
  // Sort scopes by display_order (caller may not have)
  const sortedScopes = [...scopes].sort((a, b) => a.display_order - b.display_order)

  const items = buildCandidateItems(rows, sortedScopes)

  // Group items by [scopeIdx][tier]
  const buckets: Record<DifficultyTier, CandidateItem[][]> = {
    basic: sortedScopes.map(() => []),
    enhancement: sortedScopes.map(() => []),
    advanced: sortedScopes.map(() => []),
  }
  for (const it of items) {
    buckets[it.difficulty_tier][it.scopeIdx].push(it)
  }

  const tiers: DifficultyTier[] = ['basic', 'enhancement', 'advanced']
  const selected: CandidateItem[] = []
  const warnings: string[] = []
  const perTierActual: Record<DifficultyTier, number> = { basic: 0, enhancement: 0, advanced: 0 }
  const usedKeys = new Set<string>()

  for (const tier of tiers) {
    const quota = tierQuota[tier]
    if (quota <= 0) continue
    const allocations = allocateByEvenDist(sortedScopes.length, quota)

    // First pass: take min(allocation, available) from each scope
    const shortfalls: number[] = sortedScopes.map(() => 0)
    for (let i = 0; i < sortedScopes.length; i++) {
      const want = allocations[i]
      const available = buckets[tier][i].filter((it) => !usedKeys.has(it.key))
      const take = Math.min(want, available.length)
      shuffleInPlace(available)
      for (let k = 0; k < take; k++) {
        selected.push(available[k])
        usedKeys.add(available[k].key)
        perTierActual[tier] += 1
      }
      shortfalls[i] = want - take
    }

    // Second pass: borrow from neighbors. For each scope with shortfall,
    // search outward (closest first) for a scope with surplus capacity at
    // this tier and steal items.
    for (let i = 0; i < sortedScopes.length; i++) {
      let need = shortfalls[i]
      if (need <= 0) continue
      // Try every other scope, ordered by distance from i
      const others = sortedScopes
        .map((_, j) => j)
        .filter((j) => j !== i)
        .sort((a, b) => Math.abs(a - i) - Math.abs(b - i) || a - b)
      for (const j of others) {
        if (need <= 0) break
        const available = buckets[tier][j].filter((it) => !usedKeys.has(it.key))
        shuffleInPlace(available)
        for (const it of available) {
          if (need <= 0) break
          selected.push(it)
          usedKeys.add(it.key)
          perTierActual[tier] += 1
          need -= 1
        }
      }
      if (need > 0) {
        warnings.push(
          `Tier ${tier}: short ${need} questions across all selected scopes (pool exhausted).`,
        )
      }
    }
  }

  // ── Cross-tier fill pass ────────────────────────────────────────────────
  // After per-tier quotas + neighbour borrow, if total < TOTAL_QUOTA we
  // pull more items from selected scopes regardless of tier. Without this
  // step a parent who picks a thin topic (e.g. one that has 0 advanced)
  // would get fewer than 20 questions even when the SAME scope has more
  // questions available in other tiers. Fill up to TOTAL_QUOTA, capped at
  // MAX_TOTAL. Order: enhancement → basic → advanced (mid-difficulty first
  // so the assessment doesn't tilt to easy if cross-tier fill kicks in).
  const TOTAL_QUOTA = tiers.reduce((s, t) => s + tierQuota[t], 0)
  const xfillOrder: DifficultyTier[] = ['enhancement', 'basic', 'advanced']
  for (const tier of xfillOrder) {
    if (selected.length >= TOTAL_QUOTA) break
    for (let i = 0; i < sortedScopes.length && selected.length < TOTAL_QUOTA; i++) {
      const available = buckets[tier][i].filter((it) => !usedKeys.has(it.key))
      shuffleInPlace(available)
      for (const it of available) {
        if (selected.length >= TOTAL_QUOTA) break
        selected.push(it)
        usedKeys.add(it.key)
        perTierActual[tier] += 1
      }
    }
  }

  // Gap-fill pass: every selected scope must have ≥1 question.
  // If the base quota left a scope empty, add one question (basic preferred)
  // using the budget up to MAX_TOTAL.
  const coveredScopes = new Set(selected.map((it) => it.scopeIdx))
  for (let i = 0; i < sortedScopes.length && selected.length < MAX_TOTAL; i++) {
    if (coveredScopes.has(i)) continue
    let filled = false
    for (const tier of tiers) {
      const available = buckets[tier][i].filter((it) => !usedKeys.has(it.key))
      if (available.length === 0) continue
      const pick = available[Math.floor(Math.random() * available.length)]
      selected.push(pick)
      usedKeys.add(pick.key)
      perTierActual[tier] += 1
      coveredScopes.add(i)
      filled = true
      break
    }
    if (!filled) {
      warnings.push(`Scope ${sortedScopes[i].id}: no questions available in any tier (cannot guarantee coverage).`)
    }
  }

  // Sort: basic first, then enhancement, then advanced. Within tier, order by
  // scope index (so first-learned units come earlier in their tier).
  const tierOrder: Record<DifficultyTier, number> = { basic: 0, enhancement: 1, advanced: 2 }
  selected.sort((a, b) => {
    const t = tierOrder[a.difficulty_tier] - tierOrder[b.difficulty_tier]
    if (t !== 0) return t
    return a.scopeIdx - b.scopeIdx
  })

  return { selectedItems: selected, perTierActual, warnings }
}

// ── Helper: flatten items to ordered question id list (for downstream fetch) ─

export function flattenItemsToRowOrder(items: CandidateItem[]): { id: string; group_key: string; sub_order: number }[] {
  const out: { id: string; group_key: string; sub_order: number }[] = []
  for (const it of items) {
    for (const r of it.rows) {
      out.push({ id: r.id, group_key: it.key, sub_order: r.sub_order })
    }
  }
  return out
}
