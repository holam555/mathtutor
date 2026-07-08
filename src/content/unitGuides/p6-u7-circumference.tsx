import type { UnitGuide } from './registry'

/**
 * P6 U7 圓周的計算 — 單元指南（docs/seo_strategy.md §7 長尾組合
 * 「小六 圓周」「圓周 公式」，呈分試幾何常考單元，6A 單元七）。
 *
 * 內容係公開教學文章（非 UI chrome），按 i18n 規則 5 不翻譯。
 * 全部例題答案已獨立重解驗證（求圓周×2、反求直徑半徑、半圓周界、車輪應用）。
 * 只教圓周 — 圓面積屬 6B 單元十一，本文只留 pointer 唔展開。
 */

function Guide() {
  return (
    <article className="prose-guide space-y-6 text-gray-800 leading-relaxed">
      {/* 答案前置 — AI snippet 會抽呢兩句 */}
      <p className="text-lg">
        <strong>圓周公式只有一條：圓周 = 直徑 × 圓周率，亦可寫成圓周 = 2 × 半徑 × 圓周率。</strong>
        香港小六計算時圓周率（π）一律取 3.14。搞清楚題目畀你嘅係<strong>直徑</strong>定<strong>半徑</strong>，
        係呢個單元（6A 單元七）嘅第一關 — 畀半徑就先乘 2 變直徑，之後就係一步乘法。
        呈分試最鍾意喺半圓周界設陷阱：半圓弧之外仲要<strong>加返條直徑</strong>先係完整周界。
      </p>

      <section>
        <h2 className="text-xl font-bold text-gray-900">圓周公式係咩？直徑同半徑兩條公式有咩分別？</h2>
        <p>
          <strong>圓周 = 直徑 × 圓周率 = 2 × 半徑 × 圓周率。</strong>
          其實係同一條公式，因為直徑 = 2 × 半徑。做題第一步永遠係問自己：
          題目畀嘅數係直徑定半徑？畀直徑就直接乘 3.14；畀半徑就先乘 2。
        </p>
        <div className="bg-gray-50 rounded-xl p-4 mt-3 font-mono text-sm">
          <p className="font-sans font-semibold mb-2">例題一：一個圓的直徑是 8 厘米，圓周是多少？</p>
          <p>圓周 = 直徑 × 圓周率</p>
          <p>圓周 = 8 × 3.14 = <strong>25.12 厘米</strong></p>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 mt-3 font-mono text-sm">
          <p className="font-sans font-semibold mb-2">例題二：一個圓的半徑是 6 厘米，圓周是多少？</p>
          <p>直徑 = 6 × 2 = 12 厘米</p>
          <p>圓周 = 12 × 3.14 = <strong>37.68 厘米</strong></p>
          <p>（3.14 × 12 = 31.4 + 6.28 = 37.68）</p>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          貼士：叫小朋友喺題目圈住「直徑」或「半徑」兩個字先郁筆 — 呢個單元一半嘅失分都係半徑當直徑。
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-gray-900">圓周率（π）係乜嘢？點解計數用 3.14？</h2>
        <p>
          圓周率係<strong>圓周同直徑嘅比</strong>：任何圓，無論大細，圓周除以直徑都係同一個數，
          大約係 3.14159…。佢本身係一個<strong>無限不循環小數</strong>，寫極都寫唔完，
          所以香港小六課程規定：計算時取近似值 <strong>3.14</strong>（除非題目另有聲明）。
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-gray-900">知道圓周，點樣反求直徑或半徑？</h2>
        <p>
          <strong>直徑 = 圓周 ÷ 3.14，用除法，唔係乘法。</strong>
          求完直徑，半徑再除 2。呢類「掉轉問」係呈分試常見變化題。
        </p>
        <div className="bg-gray-50 rounded-xl p-4 mt-3 font-mono text-sm">
          <p className="font-sans font-semibold mb-2">例題三：一個圓的圓周是 62.8 厘米，直徑和半徑各是多少？</p>
          <p>直徑 = 62.8 ÷ 3.14 = <strong>20 厘米</strong></p>
          <p>半徑 = 20 ÷ 2 = <strong>10 厘米</strong></p>
          <p>驗算：20 × 3.14 = 62.8 ✓</p>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          自我檢查：直徑一定<strong>細過</strong>圓周（大約係圓周的三分之一）。如果計出嚟大過圓周，即係用錯咗乘法。
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-gray-900">半圓的周界點樣計？係咪圓周的一半？</h2>
        <p>
          <strong>唔係！半圓周界 = 半圓弧 + 直徑。</strong>
          圓周的一半只係嗰條彎嘅弧線；半圓形係一個封閉圖形，周界要行勻成個邊界，
          包括底部嗰條直徑。呢個係全單元最經典嘅呈分試陷阱。
        </p>
        <div className="bg-gray-50 rounded-xl p-4 mt-3 font-mono text-sm">
          <p className="font-sans font-semibold mb-2">例題四：一個半圓的直徑是 20 厘米，它的周界是多少？</p>
          <p>半圓弧 = 20 × 3.14 ÷ 2 = 62.8 ÷ 2 = 31.4 厘米</p>
          <p>周界 = 半圓弧 + 直徑 = 31.4 + 20 = <strong>51.4 厘米</strong></p>
          <p>（只答 31.4 厘米 = 中咗陷阱，冇加直徑）</p>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold text-gray-900">生活應用題：車輪滾一圈行幾遠？</h2>
        <p>
          <strong>車輪滾一圈，行嘅距離就係車輪嘅圓周。</strong>
          滾 n 圈 = 圓周 × n。呢類題經常最後要換單位（厘米 → 米），係第二個扣分位。
        </p>
        <div className="bg-gray-50 rounded-xl p-4 mt-3 font-mono text-sm">
          <p className="font-sans font-semibold mb-2">例題五：一個車輪的直徑是 50 厘米，滾動 20 圈，一共前進多少米？</p>
          <p>一圈 = 圓周 = 50 × 3.14 = 157 厘米</p>
          <p>20 圈 = 157 × 20 = 3,140 厘米</p>
          <p>3,140 厘米 = <strong>31.4 米</strong></p>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          留意題目問「厘米」定「米」— 計啱晒但單位冇轉，一樣冇分。
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-gray-900">小朋友最常犯咩錯？</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>半徑當直徑，冇乘 2</strong>：半徑 6 厘米直接 6 × 3.14 = 18.84，
            正確係先變直徑 12 再乘。做題先圈住「半徑」定「直徑」。
          </li>
          <li>
            <strong>半圓周界唔記得加直徑</strong>：只計半圓弧就收工。
            記口訣「周界 = 行勻一圈」— 半圓底部嗰條直徑都係邊界一部分。
          </li>
          <li>
            <strong>反求直徑用乘法</strong>：見到 62.8 就乘 3.14。
            由圓周「還原」返直徑一律用<strong>除法</strong>；直徑計出嚟一定細過圓周。
          </li>
          <li>
            <strong>圓周同圓面積公式混淆</strong>：圓周係「直徑 × π」（長度，單位厘米）；
            圓面積係「半徑 × 半徑 × π」（面積，單位平方厘米），屬 6B 單元十一嘅內容，升上 6B 後最易撈亂。
          </li>
          <li>
            <strong>單位錯</strong>：圓周係長度，寫「平方厘米」即錯；應用題計完厘米忘記換米。
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold text-gray-900">點樣幫小朋友準備呈分試呢個單元？</h2>
        <p>
          先確保 6A 單元四「圓的認識」嘅根基穩陣 — 圓心、半徑、直徑嘅關係（直徑 = 2 × 半徑）要一眼睇到。
          之後按四類題型各練幾條：求圓周（分別畀直徑同半徑）、反求直徑半徑、半圓周界、車輪應用，
          做嗰陣要求小朋友先圈住條件係半徑定直徑再列式；3.14 乘法都要練到穩。
          想知道小朋友具體卡在哪一類，可以做一次
          <a href="/assessment" className="text-[#1D9E75] font-semibold underline">免費學前評估</a>
          — 20 條題目自動診斷各單元強弱項，即時出報告。其他年級單元指南可到
          <a href="/resources" className="text-[#1D9E75] font-semibold underline">學習資源索引</a>。
        </p>
      </section>

      <footer className="text-sm text-gray-400 border-t border-gray-100 pt-4">
        <p>本文由霖楓學苑數學教師團隊編寫，內容依據香港小學六年級數學課程（6A 單元七）。</p>
      </footer>
    </article>
  )
}

export const p6U7Circumference: UnitGuide = {
  slug: '圓周的計算',
  grade: 6,
  unitNumber: 7,
  title: '小六數學：圓周的計算完全攻略（圓周公式＋半圓周界例題）',
  description:
    '圓周公式只有一條：圓周＝直徑×圓周率，π 取 3.14；題目只給半徑時，先乘 2 變成直徑再計。本文按香港小六課程（6A 單元七）講解求圓周、由圓周反求直徑半徑、半圓周界同車輪行幾遠四類呈分試常考題型，每類附完整步驟例題，並拆解常見錯誤，例如半徑當直徑冇乘 2、半圓弧唔記得加直徑，幫家長在家對症溫習，另附常見問題解答。',
  keywords: [
    '圓周 公式',
    '圓周率 點用',
    '小六 圓周',
    '直徑 半徑 圓周',
    'P6 圓周 計算',
    '半圓 周界',
    '呈分試 圓周',
  ],
  updated: '2026-07-08',
  faq: [
    {
      q: '圓周公式係咩？',
      a: '圓周 = 直徑 × 圓周率 = 2 × 半徑 × 圓周率。香港小六計算時圓周率取 3.14。例如直徑 8 厘米，圓周 = 8 × 3.14 = 25.12 厘米；半徑 6 厘米就先乘 2 變直徑 12，圓周 = 12 × 3.14 = 37.68 厘米。',
    },
    {
      q: '圓周率係咪等於 3.14？',
      a: '唔係完全等於。圓周率（π）係圓周除以直徑嘅比值，係一個無限不循環小數（3.14159…），3.14 只係香港小六課程規定嘅計算近似值，除非題目另有聲明。',
    },
    {
      q: '半圓的周界係咪圓周的一半？',
      a: '唔係。半圓周界 = 半圓弧 + 直徑。例如直徑 20 厘米：半圓弧 = 20 × 3.14 ÷ 2 = 31.4 厘米，周界 = 31.4 + 20 = 51.4 厘米。只答 31.4 係呈分試最經典嘅失分陷阱。',
    },
    {
      q: '知道圓周，點樣求直徑同半徑？',
      a: '用除法：直徑 = 圓周 ÷ 3.14，半徑再除 2。例如圓周 62.8 厘米：直徑 = 62.8 ÷ 3.14 = 20 厘米，半徑 = 10 厘米。直徑一定細過圓周，計出嚟大過圓周即係做錯。',
    },
    {
      q: '圓周同圓面積公式有咩分別？',
      a: '圓周 = 直徑 × π，係長度，單位係厘米；圓面積 = 半徑 × 半徑 × π，係面積，單位係平方厘米。圓面積屬小六下學期（6B 單元十一）嘅課題，本單元只計圓周。',
    },
  ],
  Component: Guide,
}
