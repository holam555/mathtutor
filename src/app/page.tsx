import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { getLang } from '@/lib/i18n/getLang'
import { t } from '@/lib/i18n/translate'

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

  const roles = [
    {
      href: '/login/student',
      signupHref: '/signup/student',
      emoji: '🎒',
      accent: '#1D9E75',
      tint: 'bg-[#1D9E75]/10',
      title: t('學生', lang),
      desc: t('開始數學練習', lang),
    },
    {
      href: '/login/parent',
      signupHref: '/signup/parent',
      emoji: '👨‍👩‍👧',
      accent: '#EF9F27',
      tint: 'bg-[#EF9F27]/10',
      title: t('家長', lang),
      desc: t('查看子女進度、上載 Past Paper', lang),
    },
    {
      href: '/login/teacher',
      signupHref: null,
      emoji: '🧑‍🏫',
      accent: '#4A90E2',
      tint: 'bg-[#4A90E2]/10',
      title: t('老師', lang),
      desc: t('管理題庫、審核', lang),
    },
  ]

  return (
    <main className="relative min-h-screen flex items-center justify-center px-5 py-10 overflow-hidden bg-[#F6FAF8]">
      {/* Soft brand-coloured backdrop */}
      <div aria-hidden className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-[#1D9E75]/15 blur-3xl" />
        <div className="absolute top-1/3 -right-28 w-96 h-96 rounded-full bg-[#EF9F27]/15 blur-3xl" />
        <div className="absolute -bottom-32 left-1/4 w-80 h-80 rounded-full bg-[#4A90E2]/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <Image
              src="/logo.png"
              alt="霖楓學苑 LF Academy"
              width={170}
              height={55}
              style={{ mixBlendMode: 'multiply' }}
              priority
            />
          </div>
          <p className="text-[15px] font-semibold text-gray-700 tracking-wide">
            {t('小學數學升分專家', lang)}
          </p>
          <div className="mt-3 flex items-center justify-center gap-2">
            <span className="h-px w-10 bg-gray-300" />
            <p className="text-xs text-gray-400">{t('請選擇你的身份', lang)}</p>
            <span className="h-px w-10 bg-gray-300" />
          </div>
        </div>

        {/* Role cards */}
        <div className="space-y-3">
          {roles.map((r) => (
            <div
              key={r.href}
              className="group bg-white/90 backdrop-blur rounded-2xl shadow-[0_1px_3px_rgba(16,24,40,0.08)] ring-1 ring-gray-900/5 hover:shadow-[0_8px_24px_rgba(16,24,40,0.10)] hover:-translate-y-0.5 transition overflow-hidden"
            >
              <Link href={r.href} className="flex items-center gap-4 p-4">
                <div
                  className={`w-13 h-13 min-w-[52px] min-h-[52px] rounded-2xl ${r.tint} flex items-center justify-center text-2xl`}
                >
                  {r.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800">{r.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{r.desc}</p>
                </div>
                <span
                  className="text-lg font-bold opacity-30 group-hover:opacity-100 group-hover:translate-x-0.5 transition"
                  style={{ color: r.accent }}
                >
                  →
                </span>
              </Link>
              {r.signupHref && (
                <Link
                  href={r.signupHref}
                  className="block border-t border-gray-50 px-4 py-2 text-xs text-gray-400 hover:text-gray-600 transition"
                >
                  {t('首次使用？', lang)}{' '}
                  <span className="font-semibold underline" style={{ color: r.accent }}>
                    {t('免費註冊', lang)}
                  </span>
                </Link>
              )}
            </div>
          ))}
        </div>

        {/* Assessment CTA */}
        <div className="mt-6 pt-6 border-t border-gray-200/80">
          <Link
            href="/assessment"
            className="group block rounded-2xl p-[1.5px] bg-gradient-to-r from-teal-400 via-teal-500 to-emerald-500 shadow-[0_8px_20px_rgba(20,150,110,0.25)] hover:shadow-[0_10px_28px_rgba(20,150,110,0.35)] transition"
          >
            <div className="flex items-center gap-4 rounded-[14.5px] bg-gradient-to-r from-teal-500 to-teal-600 p-5">
              <div className="w-13 h-13 min-w-[52px] min-h-[52px] rounded-2xl bg-white/20 flex items-center justify-center text-2xl">
                📝
              </div>
              <div className="min-w-0">
                <p className="font-bold text-white">{t('學前評估', lang)}</p>
                <p className="text-xs text-white/80 mt-0.5">
                  {t('免費評估數學程度，即時獲取診斷報告', lang)}
                </p>
              </div>
              <span className="ml-auto text-white/70 group-hover:translate-x-0.5 transition">→</span>
            </div>
          </Link>
        </div>

        <p className="text-xs text-gray-400 text-center mt-6 leading-relaxed">
          {t('學生及家長可自行註冊', lang)}
          <br />
          {t('老師帳戶請聯絡管理員', lang)}
        </p>
      </div>
    </main>
  )
}
