# i18n conventions — EN/中 toggle

The app is Traditional Chinese by default with an English toggle for UI
chrome. This doc is the contract for anyone (human or AI) touching UI text.
CI runs `node scripts/check_i18n.mjs` and fails on violations of rule 4/5.

## How it works

- Cookie `lang` (`zh` | `en`) is the source of truth. `zh` is the default.
- `src/lib/i18n/dict.ts` — one flat map: exact Chinese string → English.
- `src/lib/i18n/translate.ts` — `t(zh, lang)`: returns `zh` unchanged when
  `lang === 'zh'`, else `dict[zh] ?? zh`. **A missing key never crashes —
  it silently shows Chinese in EN mode.** That's why CI checks coverage.
- `src/lib/i18n/getLang.ts` — server-only cookie reader.
- `src/lib/i18n/LanguageProvider.tsx` — client context. The toggle writes
  `document.cookie` and calls `router.refresh()`, so server components
  re-render in the new language without a full reload.
- `src/components/LanguageToggle.tsx` — the floating 🌐 中文/EN pill,
  mounted once in `src/app/layout.tsx`.

## The five rules

1. **Server components**: `const lang = getLang()` once at the top, then
   `{translate('中文', lang)}` (import `{ t as translate }` from
   `@/lib/i18n/translate`).

2. **Client components**: `const { t } = useLang()` then `{t('中文')}`.
   ⚠️ Many files use `t` as a `.map((t) => …)` loop variable — in those
   files destructure as `const { t: translate } = useLang()` instead of
   renaming loop vars.

3. **Sentences with interpolated values**: don't split a sentence into
   word-fragments. Use a bilingual ternary instead:
   `lang === 'en' ? `${n} questions done` : `已完成 ${n} 題``

4. **Every wrapped string needs a dict entry.** Add the dict entry in the
   same edit as the `t()` call. `node scripts/check_i18n.mjs` fails the
   build if a `t('中文')` literal has no dict key, or dict has duplicates.

5. **Never translate content.** Off-limits: `question_text`, `options`,
   `correct_answer`, `model_answer`, curriculum unit/topic names, anything
   from the DB, AI-generated report body text, the printable exam sheets
   (`ExamPaperSheet.tsx`, the LQ paper body in
   `student/mock-exam/[paperId]/lq/page.tsx`) — those are real exam papers
   for HK students — and `FractionDisplay.tsx`'s `又`-notation parsing.

## Out of scope (deliberately untranslated)

- API route error strings (`src/app/api/**`) — server responses, shown
  raw; translating them needs the request's cookie and wasn't worth the
  plumbing for a recruiter-facing toggle.
- The informational section of `check_i18n.mjs` output lists remaining
  raw-Chinese files; most are intentional zh-branches of rule-3 ternaries
  which the line-based heuristic can't see. Treat that list as a to-do
  radar, not as errors.
