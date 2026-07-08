import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { getLang } from '@/lib/i18n/getLang'
import { t as translate } from '@/lib/i18n/translate'
import { guidePath, unitGuides } from '@/content/unitGuides/registry'

// 品牌色 tokens（logo 取色）— 見 docs/design_strategy.md §2
// 楓葉橙 #E8792F（行動）/ 深橙 #D96820 / 書本墨綠 #1F4D36（標題、信任）
// 品牌青綠 #1D9E75（成功、成長）/ 鼓勵 amber #EF9F27（永不用紅）
const CONTACT = {
  phoneDisplay: '+852 5601 1931',
  phoneHref: 'tel:+85256011931',
  whatsapp:
    'https://api.whatsapp.com/send/?phone=85256011931&text&type=phone_number&app_absent=0',
  instagram: 'https://www.instagram.com/lf.academy.hk',
}

export default async function Home() {
  const supabase = createClient()
  const lang = getLang()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If already logged in, send to role-specific home
  if (user) {
    const role = user.user_metadata?.role as string | undefined
    if (role === 'teacher') redirect('/admin')
    if (role === 'parent') redirect('/parent')
    if (role === 'student') redirect('/student')
  }

  const equation = [
    { emoji: '🔍', label: translate('搵弱項', lang), rot: '-rotate-3', style: 'bg-white dark:bg-white/10 ring-2 ring-[#1D9E75]/50 text-[#1F4D36] dark:text-gray-100' },
    { op: '＋' },
    { emoji: '🎯', label: translate('對準練', lang), rot: 'rotate-2', style: 'bg-white dark:bg-white/10 ring-2 ring-[#E8792F]/50 text-[#1F4D36] dark:text-gray-100' },
    { op: '＝' },
    { emoji: '⭐', label: translate('升分', lang), rot: '-rotate-1', style: 'bg-[#1F4D36] text-white ring-2 ring-[#1F4D36]' },
  ]

  const reportRows = [
    { name: translate('分數加減', lang), pct: 85, label: translate('掌握良好', lang), color: '#1D9E75' },
    { name: translate('小數乘除', lang), pct: 40, label: translate('建議加強', lang), color: '#EF9F27' },
    { name: translate('圖形與空間', lang), pct: 65, label: translate('一般', lang), color: '#4A90E2' },
  ]

  const diagnosisPoints = [
    translate('20 條題，AI 自動分析每個單元嘅掌握度', lang),
    translate('每個單元獨立評級，唔會一句「數學差」帶過', lang),
    translate('報告直接話你知應該由邊個單元開始補', lang),
  ]

  const steps = [
    {
      n: '01',
      color: '#E8792F',
      title: translate('做一次免費評估', lang),
      desc: translate('揀年級同單元，20 條題約 15 分鐘，手機直接做', lang),
    },
    {
      n: '02',
      color: '#1D9E75',
      title: translate('即時攞 AI 診斷報告', lang),
      desc: translate('AI 即時分析邊個單元強、邊個單元弱，一份報告一眼睇晒', lang),
    },
    {
      n: '03',
      color: '#E8792F',
      title: translate('對準弱項練習', lang),
      desc: translate('之後每次練習都針對弱項出題，唔嘥時間操已經識嘅嘢', lang),
    },
  ]

  const features = [
    {
      emoji: '🤖',
      accent: '#1D9E75',
      title: translate('AI 智能出題', lang),
      desc: translate('AI 根據小朋友嘅弱項自動生成新題目，操極都有新題做', lang),
    },
    {
      emoji: '📒',
      accent: '#E8792F',
      title: translate('錯題自動追蹤', lang),
      desc: translate('做錯嘅題自動入錯題簿，反覆再練，練到識為止', lang),
    },
    {
      emoji: '⏱️',
      accent: '#4A90E2',
      title: translate('模擬考試', lang),
      desc: translate('跟學校考試範圍出卷、計時作答，考試前操 fit 晒', lang),
    },
    {
      emoji: '📄',
      accent: '#1F4D36',
      title: translate('Past Paper 題庫', lang),
      desc: translate('題目源自真實試卷，貼近香港學校出題風格', lang),
    },
    {
      emoji: '⭐',
      accent: '#EF9F27',
      title: translate('星星獎勵', lang),
      desc: translate('答啱有星星、儲獎杯，小朋友自己主動想做', lang),
    },
  ]

  const roles = [
    {
      href: '/login/student',
      signupHref: '/signup/student',
      emoji: '🎒',
      accent: '#1D9E75',
      tint: 'bg-[#1D9E75]/10',
      title: translate('學生', lang),
      desc: translate('開始數學練習', lang),
    },
    {
      href: '/login/parent',
      signupHref: '/signup/parent',
      emoji: '👨‍👩‍👧',
      accent: '#E8792F',
      tint: 'bg-[#E8792F]/10',
      title: translate('家長', lang),
      desc: translate('查看子女進度、上載 Past Paper', lang),
    },
    {
      href: '/login/teacher',
      signupHref: null,
      emoji: '🧑‍🏫',
      accent: '#4A90E2',
      tint: 'bg-[#4A90E2]/10',
      title: translate('老師', lang),
      desc: translate('管理題庫、審核', lang),
    },
  ]

  const featuredGuides = unitGuides.slice(0, 4)

  return (
    <main className="relative min-h-screen overflow-hidden paper-grid text-gray-800 dark:text-gray-200">
      {/* Floating math glyphs — decoration only */}
      <div aria-hidden className="absolute inset-0 pointer-events-none select-none">
        <span className="absolute top-28 left-[5%] text-6xl font-extrabold text-[#E8792F]/[0.09] dark:text-[#E8792F]/[0.16] rotate-[-12deg]">÷</span>
        <span className="absolute top-40 right-[7%] text-7xl font-extrabold text-[#1D9E75]/[0.08] dark:text-[#1D9E75]/[0.15] rotate-[10deg]">¾</span>
        <span className="absolute top-[42rem] left-[10%] text-6xl font-extrabold text-[#4A90E2]/[0.08] dark:text-[#4A90E2]/[0.15] rotate-[8deg]">%</span>
        <span className="absolute top-[70rem] right-[5%] text-6xl font-extrabold text-[#E8792F]/[0.08] dark:text-[#E8792F]/[0.15] rotate-[-8deg]">×</span>
        <span className="absolute bottom-72 left-[6%] text-7xl font-extrabold text-[#1D9E75]/[0.07] dark:text-[#1D9E75]/[0.14] rotate-[6deg]">π</span>
      </div>

      {/* ── Top bar ─────────────────────────────────────── */}
      {/* pt-14 on mobile clears the fixed top-centre LanguageToggle pill */}
      <header className="relative z-10 max-w-5xl mx-auto flex items-center justify-between px-5 pt-14 pb-4 sm:py-4">
        <span className="inline-flex dark:bg-[#FBFAF5] dark:rounded-xl dark:px-2 dark:py-1">
          <Image
            src="/logo.png"
            alt="霖楓學苑 LF Academy"
            width={120}
            height={39}
            style={{ mixBlendMode: 'multiply' }}
            priority
          />
        </span>
        <nav className="flex items-center gap-2">
          <Link
            href="/resources"
            className="hidden sm:block px-3 py-2 text-sm font-semibold text-gray-500 hover:text-[#1F4D36] dark:text-gray-400 dark:hover:text-gray-100 transition"
          >
            {translate('免費資源', lang)}
          </Link>
          <Link
            href="#login"
            className="px-4 py-2 text-sm font-semibold text-gray-600 rounded-xl ring-1 ring-gray-300 hover:ring-gray-400 bg-white/70 dark:text-gray-300 dark:ring-white/20 dark:hover:ring-white/40 dark:bg-white/5 transition"
          >
            {translate('登入', lang)}
          </Link>
          <Link
            href="/assessment"
            className="px-4 py-2 text-sm font-bold text-white rounded-xl bg-[#E8792F] hover:bg-[#D96820] shadow-[0_4px_12px_rgba(232,121,47,0.35)] transition"
          >
            {translate('免費評估', lang)}
          </Link>
        </nav>
      </header>

      {/* ── Hero（置中式，equation strip 係記憶點）──────── */}
      <section className="relative z-10 max-w-4xl mx-auto px-5 pt-10 pb-16 md:pt-16 md:pb-20 text-center">
        <p className="inline-flex items-center gap-1.5 px-3.5 py-1.5 mb-6 text-xs font-bold tracking-wide text-[#1F4D36] dark:text-[#7BD8B4] bg-[#1D9E75]/10 dark:bg-[#1D9E75]/20 rounded-full">
          🍁 {translate('AI 智能診斷・香港小三至小六課程', lang)}
        </p>
        <h1 className="text-4xl md:text-6xl font-extrabold leading-[1.25] text-[#1F4D36] dark:text-white">
          {translate('數學要升分，', lang)}
          <br />
          <span className="relative inline-block px-3 py-1">
            <span className="relative z-10">{translate('先要補啱位', lang)}</span>
            {/* 手繪橙色圈圈 — 楓葉筆觸 */}
            <svg
              aria-hidden
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 240 90"
              preserveAspectRatio="none"
              fill="none"
            >
              <path
                d="M28 52 C 34 16, 196 4, 224 34 C 242 58, 168 88, 62 82 C 24 78, 8 66, 22 44"
                stroke="#E8792F"
                strokeWidth="4.5"
                strokeLinecap="round"
                opacity="0.9"
              />
            </svg>
          </span>
        </h1>
        <p className="mt-6 mx-auto max-w-xl text-[17px] leading-relaxed text-gray-600 dark:text-gray-300">
          {translate(
            '免費 AI 學前評估搵出小朋友最弱嘅單元，即時生成診斷報告；之後每一題練習都對準弱項，唔使再盲目操卷。',
            lang
          )}
        </p>

        {/* 概念方程式 — 唔係 slogan，係一條數 */}
        <div className="mt-9 flex items-center justify-center gap-2.5 sm:gap-4 flex-wrap">
          {equation.map((e, i) =>
            'op' in e ? (
              <span key={i} className="text-3xl sm:text-4xl font-extrabold text-[#1F4D36]/70 dark:text-white/60 select-none">
                {e.op}
              </span>
            ) : (
              <span
                key={i}
                className={`inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl font-extrabold text-base sm:text-lg shadow-[0_3px_10px_rgba(31,77,54,0.12)] ${e.rot} ${e.style}`}
              >
                <span aria-hidden>{e.emoji}</span>
                {e.label}
              </span>
            )
          )}
        </div>

        <div className="mt-10 flex flex-col sm:flex-row justify-center gap-3">
          <Link
            href="/assessment"
            className="inline-flex items-center justify-center gap-2 px-9 py-4 rounded-2xl bg-gradient-to-r from-[#F08A3C] to-[#E8792F] text-white font-bold text-lg shadow-[0_8px_20px_rgba(232,121,47,0.35)] hover:shadow-[0_10px_28px_rgba(232,121,47,0.45)] hover:-translate-y-0.5 transition"
          >
            {translate('免費開始評估', lang)} →
          </Link>
          <Link
            href="/resources"
            className="inline-flex items-center justify-center px-9 py-4 rounded-2xl bg-white ring-1 ring-[#1F4D36]/20 text-[#1F4D36] dark:bg-white/10 dark:ring-white/15 dark:text-gray-200 font-semibold hover:ring-[#1D9E75]/50 transition"
          >
            {translate('睇免費學習指南', lang)}
          </Link>
        </div>
        <ul className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-gray-500 dark:text-gray-400">
          {[
            translate('完全免費', lang),
            translate('唔使裝 App', lang),
            translate('約 15 分鐘完成', lang),
          ].map((s) => (
            <li key={s} className="flex items-center gap-1.5">
              <span className="text-[#1D9E75] font-bold">✓</span> {s}
            </li>
          ))}
        </ul>
      </section>

      {/* ── AI 診斷 showcase（報告卡由 hero 搬落嚟）───────── */}
      <section className="relative z-10 bg-white/80 dark:bg-white/[0.04] backdrop-blur border-y border-gray-100 dark:border-white/10">
        <div className="max-w-5xl mx-auto px-5 py-16 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-[#1F4D36] dark:text-white">
              {translate('AI 即時診斷，一眼睇晒強弱', lang)}
            </h2>
            <ul className="mt-6 space-y-4">
              {diagnosisPoints.map((p) => (
                <li key={p} className="flex items-start gap-3 text-[15px] leading-relaxed text-gray-600 dark:text-gray-300">
                  <span className="mt-0.5 w-6 h-6 min-w-[24px] rounded-full bg-[#E8792F]/15 text-[#E8792F] flex items-center justify-center text-sm font-extrabold">
                    ✓
                  </span>
                  {p}
                </li>
              ))}
            </ul>
            <Link
              href="/assessment"
              className="mt-7 inline-block text-sm font-bold text-[#E8792F] hover:underline"
            >
              {translate('免費開始評估', lang)} →
            </Link>
          </div>

          {/* Mock diagnosis report card */}
          <div className="relative mx-auto w-full max-w-sm">
            <div className="absolute -top-4 -right-3 rotate-[6deg] px-3 py-1.5 bg-[#E8792F] text-white text-xs font-bold rounded-lg shadow-md z-20">
              {translate('AI 即時生成', lang)}
            </div>
            <div className="relative z-10 bg-white dark:bg-[#1A241F] rounded-3xl shadow-[0_16px_40px_rgba(16,24,40,0.12)] ring-1 ring-gray-900/5 dark:ring-white/10 p-6 rotate-[-1.5deg]">
              <div className="flex items-center justify-between pb-4 border-b border-dashed border-gray-200 dark:border-white/15">
                <p className="font-extrabold text-[#1F4D36] dark:text-gray-100">📋 {translate('診斷報告', lang)}</p>
                <span className="text-xs font-semibold text-gray-400">P5</span>
              </div>
              <div className="mt-4 space-y-4">
                {reportRows.map((row) => (
                  <div key={row.name}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-gray-700 dark:text-gray-300">{row.name}</span>
                      <span className="text-xs font-bold" style={{ color: row.color }}>
                        {row.label}
                      </span>
                    </div>
                    <div className="mt-1.5 h-2.5 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${row.pct}%`, backgroundColor: row.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-2xl bg-[#1D9E75]/5 dark:bg-[#1D9E75]/15 border border-[#1D9E75]/15 dark:border-[#1D9E75]/30 px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                💡 {translate('建議由「小數乘除」開始練習', lang)}
              </div>
            </div>
            <div
              aria-hidden
              className="absolute inset-0 translate-x-3 translate-y-3 rounded-3xl bg-[#E8792F]/10 dark:bg-[#E8792F]/20 rotate-[1deg]"
            />
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────── */}
      <section className="relative z-10 max-w-5xl mx-auto px-5 py-16">
        <h2 className="text-2xl md:text-3xl font-extrabold text-[#1F4D36] dark:text-white text-center">
          {translate('三步搵出弱項，練啱位', lang)}
        </h2>
        <div className="mt-10 grid md:grid-cols-3 gap-8">
          {steps.map((s) => (
            <div key={s.n} className="relative pl-2">
              <span
                aria-hidden
                className="block text-6xl font-extrabold leading-none opacity-20 dark:opacity-35"
                style={{ color: s.color }}
              >
                {s.n}
              </span>
              <h3 className="mt-2 text-lg font-bold text-[#1F4D36] dark:text-gray-100">{s.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-gray-500 dark:text-gray-400">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ────────────────────────────────────── */}
      <section className="relative z-10 bg-white/80 dark:bg-white/[0.04] backdrop-blur border-y border-gray-100 dark:border-white/10">
        <div className="max-w-5xl mx-auto px-5 py-16">
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#1F4D36] dark:text-white text-center">
            {translate('唔止係練習咁簡單', lang)}
          </h2>
          <div className="mt-10 grid sm:grid-cols-2 gap-4">
            {features.map((f, i) => (
              <div
                key={f.title}
                className={`bg-white dark:bg-white/[0.06] rounded-2xl ring-1 ring-gray-900/5 dark:ring-white/10 shadow-[0_1px_3px_rgba(16,24,40,0.08)] p-6 flex gap-4 ${
                  i === features.length - 1 && features.length % 2 === 1 ? 'sm:col-span-2' : ''
                }`}
              >
                <div
                  className="w-12 h-12 min-w-[48px] rounded-2xl flex items-center justify-center text-2xl"
                  style={{ backgroundColor: `${f.accent}1A` }}
                >
                  {f.emoji}
                </div>
                <div>
                  <h3 className="font-bold text-[#1F4D36] dark:text-gray-100">{f.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-gray-500 dark:text-gray-400">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-2xl border border-dashed border-[#EF9F27]/40 bg-[#EF9F27]/5 dark:bg-[#EF9F27]/10 px-6 py-4 text-center text-sm text-gray-600 dark:text-gray-300">
            {translate('答錯唔會見到紅色交叉 — 全 App 零負面語言設計，答錯只會話「再試一次！💪」，小朋友唔怕做數', lang)}
          </div>
        </div>
      </section>

      {/* ── Free resources ──────────────────────────────── */}
      {featuredGuides.length > 0 && (
        <section className="relative z-10 max-w-5xl mx-auto px-5 py-16">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-2xl md:text-3xl font-extrabold text-[#1F4D36] dark:text-white">
              {translate('免費學習指南', lang)}
            </h2>
            <Link
              href="/resources"
              className="text-sm font-bold text-[#E8792F] hover:underline whitespace-nowrap"
            >
              {translate('全部資源', lang)} →
            </Link>
          </div>
          <p className="mt-2 text-gray-500 dark:text-gray-400 text-sm max-w-lg">
            {translate('逐個單元講解概念、例題同小朋友最常犯嘅錯 — 由老師編寫，唔使登入都睇到。', lang)}
          </p>
          <div className="mt-8 grid sm:grid-cols-2 gap-4">
            {featuredGuides.map((g) => (
              <Link
                key={g.slug}
                href={guidePath(g)}
                className="group bg-white dark:bg-white/[0.06] rounded-2xl ring-1 ring-gray-900/5 dark:ring-white/10 p-5 hover:ring-[#E8792F]/50 hover:-translate-y-0.5 transition"
              >
                <span className="text-xs font-bold text-[#E8792F]">P{g.grade}</span>
                <p className="mt-1 font-bold text-[#1F4D36] dark:text-gray-100 group-hover:text-[#E8792F] transition">
                  {g.slug}
                </p>
                <p className="mt-1 text-sm text-gray-400 line-clamp-2">{g.description}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Role entry / login ──────────────────────────── */}
      <section id="login" className="relative z-10 bg-white/80 dark:bg-white/[0.04] backdrop-blur border-y border-gray-100 dark:border-white/10 scroll-mt-8">
        <div className="max-w-5xl mx-auto px-5 py-16">
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#1F4D36] dark:text-white text-center">
            {translate('已有帳戶？選擇你的身份', lang)}
          </h2>
          <div className="mt-8 grid md:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {roles.map((r) => (
              <div
                key={r.href}
                className="group bg-white dark:bg-white/[0.06] rounded-2xl shadow-[0_1px_3px_rgba(16,24,40,0.08)] ring-1 ring-gray-900/5 dark:ring-white/10 hover:shadow-[0_8px_24px_rgba(16,24,40,0.10)] hover:-translate-y-0.5 transition overflow-hidden"
              >
                <Link href={r.href} className="flex md:flex-col md:text-center items-center gap-4 md:gap-3 p-5">
                  <div
                    className={`w-13 h-13 min-w-[52px] min-h-[52px] rounded-2xl ${r.tint} flex items-center justify-center text-2xl`}
                  >
                    {r.emoji}
                  </div>
                  <div className="flex-1 min-w-0 md:flex-none">
                    <p className="font-bold text-[#1F4D36] dark:text-gray-100">{r.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{r.desc}</p>
                  </div>
                </Link>
                {r.signupHref && (
                  <Link
                    href={r.signupHref}
                    className="block border-t border-gray-50 dark:border-white/10 px-4 py-2.5 text-xs text-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
                  >
                    {translate('首次使用？', lang)}{' '}
                    <span className="font-semibold underline" style={{ color: r.accent }}>
                      {translate('免費註冊', lang)}
                    </span>
                  </Link>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 text-center mt-6 leading-relaxed">
            {translate('學生及家長可自行註冊', lang)}・{translate('老師帳戶請聯絡管理員', lang)}
          </p>
        </div>
      </section>

      {/* ── Final CTA（書本墨綠 + 楓葉橙）────────────────── */}
      <section className="relative z-10 max-w-5xl mx-auto px-5 py-16">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1F4D36] to-[#2D5A3D] px-8 py-12 text-center shadow-[0_16px_40px_rgba(31,77,54,0.35)]">
          <span aria-hidden className="absolute -top-6 -left-4 text-7xl opacity-15 rotate-[-15deg] select-none">🍁</span>
          <span aria-hidden className="absolute -bottom-7 -right-3 text-8xl opacity-15 rotate-[12deg] select-none">🍁</span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white">
            {translate('五分鐘註冊，十五分鐘知道弱項喺邊', lang)}
          </h2>
          <p className="mt-2 text-white/80 text-sm">
            {translate('免費 AI 評估數學程度，即時獲取診斷報告', lang)}
          </p>
          <Link
            href="/assessment"
            className="mt-6 inline-block px-10 py-4 rounded-2xl bg-[#E8792F] hover:bg-[#F08A3C] text-white font-bold text-lg shadow-[0_8px_20px_rgba(0,0,0,0.25)] hover:-translate-y-0.5 transition"
          >
            {translate('免費開始評估', lang)} →
          </Link>
        </div>
      </section>

      {/* ── Footer / contact ────────────────────────────── */}
      <footer className="relative z-10 border-t border-gray-200/80 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] backdrop-blur">
        <div className="max-w-5xl mx-auto px-5 py-10 grid sm:grid-cols-2 gap-8">
          <div>
            <span className="inline-flex dark:bg-[#FBFAF5] dark:rounded-xl dark:px-2 dark:py-1">
              <Image
                src="/logo.png"
                alt="霖楓學苑 LF Academy"
                width={130}
                height={42}
                style={{ mixBlendMode: 'multiply' }}
              />
            </span>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{translate('小學數學升分專家', lang)}</p>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 space-y-2 sm:text-right">
            <p>
              <a href={CONTACT.phoneHref} className="hover:text-[#1F4D36] dark:hover:text-gray-100 transition">
                📞 {CONTACT.phoneDisplay}
              </a>
            </p>
            <p>
              <a
                href={CONTACT.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#1F4D36] dark:hover:text-gray-100 transition"
              >
                💬 WhatsApp
              </a>
              <span className="mx-2 text-gray-300 dark:text-gray-600">·</span>
              <a
                href={CONTACT.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#1F4D36] dark:hover:text-gray-100 transition"
              >
                📷 Instagram
              </a>
            </p>
            <p>
              <Link href="/resources" className="hover:text-[#1F4D36] dark:hover:text-gray-100 transition">
                {translate('免費資源', lang)}
              </Link>
              <span className="mx-2 text-gray-300 dark:text-gray-600">·</span>
              <Link href="/assessment" className="hover:text-[#1F4D36] dark:hover:text-gray-100 transition">
                {translate('學前評估', lang)}
              </Link>
            </p>
          </div>
        </div>
        <p className="pb-8 text-center text-xs text-gray-300 dark:text-gray-600">
          © {new Date().getFullYear()} 霖楓學苑 LF Academy
        </p>
      </footer>
    </main>
  )
}
