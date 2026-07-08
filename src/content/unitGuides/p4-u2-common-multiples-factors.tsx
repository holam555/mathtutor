import type { UnitGuide } from './registry'

/**
 * P4 U2 公倍數和公因數 — 單元指南（docs/seo_strategy.md §7 長尾組合
 * 「小四 公因數 公倍數」「最大公因數 點搵」「最小公倍數」）。
 *
 * 內容係公開教學文章（非 UI chrome），按 i18n 規則 5 不翻譯。
 * 全部例題答案已獨立重解驗證（12 同 18 嘅 HCF/LCM、8 同 12、每 4 日／6 日應用題）。
 * 數學深度守住 P4：以列舉法為主，短除法只作預告，唔用質因數分解。
 */

function Guide() {
  return (
    <article className="prose-guide space-y-6 text-gray-800 leading-relaxed">
      {/* 答案前置 — AI snippet 會抽呢兩句 */}
      <p className="text-lg">
        <strong>公因數是同時能整除兩個數的數，公倍數是兩個數共同的倍數。</strong>
        香港小四（4A 單元二）主要用<strong>列舉法</strong>：把兩個數的因數（或倍數）逐個列出，
        再圈出共同的，最大的公因數就是「最大公因數」，最小的公倍數就是「最小公倍數」。
        這個單元建基於單元一「倍數和因數」，亦係日後學習約分和通分的基礎，呈分試應用題經常出現。
      </p>

      <section>
        <h2 className="text-xl font-bold text-gray-900">公因數同公倍數有咩分別？</h2>
        <p>
          <strong>公因數係「共同的因數」，數值唔會大過兩個數之中較細嗰個；
          公倍數係「共同的倍數」，數值唔會細過兩個數之中較大嗰個。</strong>
          一個口訣幫小朋友分清楚：因數「拆散」一個數，所以越搵越細；
          倍數「疊大」一個數，所以越搵越大。
          例如 6 和 9：公因數有 1 和 3（細）；公倍數有 18、36、54⋯⋯（大，而且無限咁多）。
        </p>
        <p className="text-sm text-gray-500 mt-2">
          留意：公倍數有無限個，所以我們只會問「最小公倍數」；
          公因數就有限，所以會問「最大公因數」。冇「最大公倍數」呢樣嘢。
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-gray-900">最大公因數點搵？（列舉法）</h2>
        <p>
          <strong>把兩個數的因數全部列出，圈出共同的，揀最大嗰個。</strong>
          列因數時用「一對一對」的方法（1 配自己、2 配一半⋯⋯）就唔會漏。
        </p>
        <div className="bg-gray-50 rounded-xl p-4 mt-3 font-mono text-sm">
          <p className="font-sans font-semibold mb-2">例題一：求 12 和 18 的最大公因數。</p>
          <p>12 的因數：1、2、3、4、6、12（一對一對：1×12、2×6、3×4）</p>
          <p>18 的因數：1、2、3、6、9、18（1×18、2×9、3×6）</p>
          <p>公因數：1、2、3、6</p>
          <p>最大公因數 = <strong>6</strong></p>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          自我檢查：最大公因數一定能同時整除兩個數 — 12 ÷ 6 = 2、18 ÷ 6 = 3，兩個都除得盡 ✓。
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-gray-900">最小公倍數點搵？（列舉法）</h2>
        <p>
          <strong>把兩個數的倍數順序列出，第一個共同出現的就是最小公倍數。</strong>
          貼士：由較大嗰個數的倍數開始逐個試，會快好多。
        </p>
        <div className="bg-gray-50 rounded-xl p-4 mt-3 font-mono text-sm">
          <p className="font-sans font-semibold mb-2">例題二：求 12 和 18 的最小公倍數。</p>
          <p>12 的倍數：12、24、36、48、60⋯⋯</p>
          <p>18 的倍數：18、36、54、72⋯⋯</p>
          <p>第一個共同的倍數是 36</p>
          <p>最小公倍數 = <strong>36</strong></p>
          <p>驗算：36 ÷ 12 = 3、36 ÷ 18 = 2，兩個都除得盡 ✓</p>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          留意：12 × 18 = 216 亦係公倍數，但唔係<strong>最小</strong>嗰個 —
          唔好一見題目就直接兩數相乘（下面「常犯錯誤」會再講）。
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-gray-900">公倍數應用題點做？（「幾時再同一日」題型）</h2>
        <p>
          <strong>見到「每 X 日一次、每 Y 日一次，幾時再一齊發生」，就係搵 X 和 Y 的最小公倍數。</strong>
          呢類係本單元最常考的應用題。
        </p>
        <div className="bg-gray-50 rounded-xl p-4 mt-3 font-mono text-sm">
          <p className="font-sans font-semibold mb-2">
            例題三：小明每 4 日游一次泳，小芳每 6 日游一次。今日兩人一齊游泳，最少再過多少日會再一齊游？
          </p>
          <p>4 的倍數：4、8、12、16、20⋯⋯</p>
          <p>6 的倍數：6、12、18、24⋯⋯</p>
          <p>4 和 6 的最小公倍數 = 12</p>
          <p>答：最少再過 <strong>12 日</strong>。</p>
        </div>
        <p className="mt-3">
          相反，如果題目係「把兩批物件<strong>分成同樣大小的組</strong>，每組最多幾多個」
          （例如 12 支紅筆和 18 支藍筆平均分畀最多幾多個同學），就係搵<strong>最大公因數</strong>（答案是 6 個同學）。
          分辨方法：問「合埋等幾耐／幾時再遇」用公倍數，問「拆開分組／剪成幾長」用公因數。
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-gray-900">小朋友最常犯咩錯？</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>公因數同公倍數掉轉</strong>：題目問最大公因數，答咗最小公倍數。
            檢查方法好簡單 — 公因數一定<strong>唔大過</strong>原本兩個數，公倍數一定<strong>唔細過</strong>佢哋。
            如果「最大公因數」計出嚟大過 12 和 18，即刻知道錯咗。
          </li>
          <li>
            <strong>以為最小公倍數一定係兩數相乘</strong>：12 × 18 = 216，但最小公倍數其實係 36。
            只有當兩個數的最大公因數係 1（例如 3 和 4），最小公倍數先至等於相乘（3 × 4 = 12）。
          </li>
          <li>
            <strong>漏咗 1 係公因數</strong>：任何兩個數都最少有 1 呢個公因數。
            列因數時由 1 開始寫，就唔會漏。
          </li>
          <li>
            <strong>列因數唔齊漏咗一對</strong>：例如 18 的因數漏咗 6 和 3 其中一個。
            用配對法（1×18、2×9、3×6）逐對寫，寫到兩邊「相遇」為止。
          </li>
          <li>
            <strong>忘記數自己都係自己嘅因數同倍數</strong>：12 係 12 的因數，亦係 12 的第一個倍數。
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold text-gray-900">點樣幫小朋友溫好呢個單元？</h2>
        <p>
          先確保單元一「倍數和因數」的根基穩陣 — 因數配對法同倍數的定義要一問即答，
          再要求小朋友每次落筆前先講出「呢題搵公因數定公倍數？」。
          日常練習可以由細數字開始（6 和 8、9 和 12），列舉法寫齊每一步，唔好心算跳步。
          小四階段以列舉法為主就夠；「短除法」係高年級先會正式學嘅快捷算法，暫時知道有呢樣嘢就得。
          想知道小朋友喺倍數因數呢條線上具體卡喺邊，可以做一次
          <a href="/assessment" className="text-[#1D9E75] font-semibold underline">免費學前評估</a>
          — 20 條題目自動診斷各單元強弱項，即時出報告。其他年級單元指南可到
          <a href="/resources" className="text-[#1D9E75] font-semibold underline">學習資源索引</a>。
        </p>
      </section>

      <footer className="text-sm text-gray-400 border-t border-gray-100 pt-4">
        <p>本文由霖楓學苑數學教師團隊編寫，內容依據香港小學四年級數學課程（4A 單元二）。</p>
      </footer>
    </article>
  )
}

export const p4U2CommonMultiplesFactors: UnitGuide = {
  slug: '公倍數和公因數',
  grade: 4,
  unitNumber: 2,
  title: '小四數學：公倍數和公因數完全攻略（最大公因數＋最小公倍數例題）',
  description:
    '公因數是同時能整除兩個數的數，公倍數是兩個數共同的倍數；小四主要用列舉法逐個列出再圈出共同的。本文依香港小四課程（4A 單元二）示範最大公因數和最小公倍數的搵法，附 12 和 18 完整步驟例題及「每 4 日、6 日一次幾時再一齊」應用題，拆解常見錯誤如公因數公倍數混淆、以為最小公倍數一定係兩數相乘，幫家長在家溫習。',
  keywords: [
    '小四 公因數 公倍數',
    '最大公因數 點搵',
    '最小公倍數',
    'P4 數學 公倍數',
    '公因數 公倍數 分別',
    '列舉法 因數',
    'HCF LCM 小學',
  ],
  updated: '2026-07-08',
  faq: [
    {
      q: '公因數同公倍數有咩分別？',
      a: '公因數係兩個數共同的因數，數值唔會大過兩數中較細嗰個；公倍數係兩個數共同的倍數，數值唔會細過兩數中較大嗰個。例如 12 和 18：公因數有 1、2、3、6；公倍數有 36、72、108⋯⋯無限咁多。',
    },
    {
      q: '最大公因數點搵？',
      a: '小四用列舉法：把兩個數的因數全部列出，圈出共同的，揀最大嗰個。例如 12 的因數係 1、2、3、4、6、12，18 的因數係 1、2、3、6、9、18，公因數係 1、2、3、6，所以最大公因數係 6。',
    },
    {
      q: '最小公倍數係咪一定等於兩數相乘？',
      a: '唔一定。12 和 18 相乘係 216，但最小公倍數係 36。只有當兩個數的最大公因數係 1（例如 3 和 4）時，最小公倍數先等於兩數相乘。',
    },
    {
      q: '1 係咪任何數嘅公因數？',
      a: '係。1 能整除任何整數，所以任何兩個數最少都有 1 呢個公因數。列因數時由 1 開始寫就唔會漏。',
    },
    {
      q: '小四使唔使識短除法？',
      a: '唔使。香港小四課程以列舉法為主，短除法係高年級先正式學嘅快捷算法。小四階段列舉法寫齊步驟已經足夠應付考試。',
    },
  ],
  Component: Guide,
}
