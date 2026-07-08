import type { UnitGuide } from './registry'

/**
 * P6 U9 百分數應用 — 第二篇單元指南（docs/seo_strategy.md §7 長尾組合
 * 「小六 百分數 應用題」，呈分試高頻考點）。
 *
 * 內容係公開教學文章（非 UI chrome），按 i18n 規則 5 不翻譯。
 * 全部例題答案已獨立重解驗證（折扣、求原價、百分比增減、利息）。
 */

function Guide() {
  return (
    <article className="prose-guide space-y-6 text-gray-800 leading-relaxed">
      {/* 答案前置 — AI snippet 會抽呢兩句 */}
      <p className="text-lg">
        <strong>百分數應用題的關鍵只有一個：搵準「基數」（即單位一）。</strong>
        折扣以<strong>原價</strong>做基數，增減以<strong>變化前的量</strong>做基數，利息以<strong>本金</strong>做基數。
        基數搵啱咗，之後就係一步乘法或除法。這是香港小六下學期（6B 單元九）的重點單元，
        也是呈分試應用題的常客 — 折扣、求原價、百分比增減、利息四類題型幾乎每年都出。
      </p>

      <section>
        <h2 className="text-xl font-bold text-gray-900">折扣問題點樣計？</h2>
        <p>
          <strong>售價 = 原價 × 折扣百分數。</strong>香港講「x 折」即係原價的 x0%：
          八折 = 80%，七五折 = 75%。第一步永遠係把「折」化做百分數。
        </p>
        <div className="bg-gray-50 rounded-xl p-4 mt-3 font-mono text-sm">
          <p className="font-sans font-semibold mb-2">例題一：一件外套原價 $480，以八折發售，售價是多少？</p>
          <p>八折 = 80% = 0.8</p>
          <p>售價 = 480 × 0.8 = <strong>$384</strong></p>
          <p>（折扣額 = 480 − 384 = $96，即慳咗原價的 20%）</p>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          貼士：題目問「售價」定「折扣額（慳幾多）」要睇清楚 — 兩個都係常見問法，答錯咗成條題冇分。
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-gray-900">知道售價，點樣求返原價？</h2>
        <p>
          <strong>原價 = 售價 ÷ 折扣百分數，用除法，唔係乘法。</strong>
          因為售價只係原價的一部分，要「還原」返單位一就要除。
        </p>
        <div className="bg-gray-50 rounded-xl p-4 mt-3 font-mono text-sm">
          <p className="font-sans font-semibold mb-2">例題二：一部電話以七五折發售，售價是 $2,250，原價是多少？</p>
          <p>七五折 = 75% = 0.75</p>
          <p>原價 × 0.75 = 2,250</p>
          <p>原價 = 2,250 ÷ 0.75 = <strong>$3,000</strong></p>
          <p>驗算：3,000 × 0.75 = 2,250 ✓</p>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          自我檢查：原價一定要<strong>大過</strong>折扣後的售價。如果計出嚟細過售價，即係用錯咗乘法。
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-gray-900">百分比增加同減少點樣計？</h2>
        <p>
          增加 r%：新量 = 原量 × (1 + r%)；減少 r%：新量 = 原量 × (1 − r%)。
          分兩步做亦得：先計變化量（原量 × r%），再加返或減返落原量。
        </p>
        <div className="bg-gray-50 rounded-xl p-4 mt-3 font-mono text-sm">
          <p className="font-sans font-semibold mb-2">例題三：去年學費 $1,200，今年增加 15%，今年學費是多少？</p>
          <p>增加額 = 1,200 × 15% = 1,200 × 0.15 = $180</p>
          <p>今年學費 = 1,200 + 180 = <strong>$1,380</strong></p>
          <p>（一步做法：1,200 × 1.15 = 1,380，答案一樣）</p>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold text-gray-900">利息點樣計？</h2>
        <p>
          <strong>利息 = 本金 × 年利率 × 年期</strong>；本利和 = 本金 + 利息。
          例如把 $5,000 存入銀行一年，年利率 2%：利息 = 5,000 × 2% = $100，
          本利和 = 5,000 + 100 = $5,100。小學階段只考單利息，唔使理複息。
        </p>
        <p className="text-sm text-gray-500 mt-2">
          留意年期單位：如果存半年，年期係 0.5 年，唔好照用 1 年計。
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-gray-900">小朋友最常犯咩錯？</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>八折當 8%</strong>：八折係原價的 80%，慳 20%。「折」字後面補返個 0 先化百分數。
          </li>
          <li>
            <strong>求原價用乘法</strong>：見到 75% 就 2,250 × 0.75，計出 $1,687.5 —
            原價點會平過售價？求基數（單位一）一律用<strong>除法</strong>。
          </li>
          <li>
            <strong>連續折扣直接相加</strong>：先九折再八折，以為等於七折。
            其實要相乘：90% × 80% = 72%，即七二折。因為第二次折扣的基數已經係九折後的價錢。
          </li>
          <li>
            <strong>以為增減會抵銷</strong>：增加 20% 再減少 20% 唔會返回原數 —
            100 加 20% 變 120，120 減 20%（即 24）變 96，最後比原數少 4%。兩次的基數唔同。
          </li>
          <li>
            <strong>問百分比時基數搞錯</strong>：「甲比乙多 25%」的基數係<strong>乙</strong>；
            「乙比甲少幾多個百分比」的基數就變咗<strong>甲</strong>，答案唔係 25%（係 20%）。
            做呢類題先圈住「比」字後面嗰個量。
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold text-gray-900">點樣幫小朋友準備呈分試呢個單元？</h2>
        <p>
          百分數應用的根基係 6A 單元二「百分數的認識」— 百分數、小數、分數三者互化要熟
          （80% = 0.8 = 4/5 要一眼睇到）。互化唔穩，折扣同利息題步步都會慢。
          建議每類題型（折扣、求原價、增減、利息）各練幾條，做嗰陣要求小朋友先寫低「基數係乜」再郁筆。
          想知道小朋友具體卡在哪一類，可以做一次
          <a href="/assessment" className="text-[#1D9E75] font-semibold underline">免費學前評估</a>
          — 20 條題目自動診斷各單元強弱項，即時出報告。其他年級單元指南可到
          <a href="/resources" className="text-[#1D9E75] font-semibold underline">學習資源索引</a>。
        </p>
      </section>

      <footer className="text-sm text-gray-400 border-t border-gray-100 pt-4">
        <p>本文由霖楓學苑數學教師團隊編寫，內容依據香港小學六年級數學課程（6B 單元九）。</p>
      </footer>
    </article>
  )
}

export const p6U9PercentageApplications: UnitGuide = {
  slug: '百分數應用',
  grade: 6,
  unitNumber: 9,
  title: '小六數學：百分數應用題完全攻略（折扣＋求原價＋利息例題）',
  description:
    '百分數應用題的關鍵是先搵準基數（單位一）：折扣以原價做基數，增減以變化前的量做基數。本文按香港小六課程（6B 單元九）講解折扣、求原價、百分比增減和利息四類呈分試常考題型，每類附完整步驟例題，並拆解小朋友最常犯的錯誤，例如八折當 8%、連續折扣直接相加，幫家長在家對症溫習。另附常見問題解答，可用免費評估診斷強弱項。',
  keywords: [
    '小六 百分數 應用題',
    'P6 百分數',
    '呈分試 百分數',
    '折扣 計算方法',
    '百分比增減',
    '求原價',
    '利息 計算 小學',
  ],
  updated: '2026-07-07',
  faq: [
    {
      q: '八折即係幾多個百分比？',
      a: '八折即係售價是原價的 80%，唔係 8%。「x 折」= 原價的 x0%，例如七五折 = 75%。折扣額（慳咗幾多）= 原價的 20%。',
    },
    {
      q: '知道折扣後售價，點樣求原價？',
      a: '用除法：原價 = 售價 ÷ 折扣百分數。例如七五折售 $2,250，原價 = 2,250 ÷ 0.75 = $3,000。切忌用乘法 — 原價一定大過售價，計出嚟細過售價即係做錯。',
    },
    {
      q: '先九折再八折，等唔等於七折？',
      a: '唔等於。連續折扣要相乘：90% × 80% = 72%，即七二折，貴過七折少少。因為第二次折扣的基數係九折後的價錢，唔係原價。',
    },
    {
      q: '增加 20% 之後再減少 20%，會唔會返回原價？',
      a: '唔會。兩次的基數唔同：100 增加 20% 變 120，120 減少 20%（即 24）變 96，結果比原數少 4%。',
    },
    {
      q: '小學利息題點樣計？',
      a: '利息 = 本金 × 年利率 × 年期，本利和 = 本金 + 利息。例如 $5,000 存一年、年利率 2%：利息 = 5,000 × 2% = $100，本利和 $5,100。小學只考單利息。',
    },
  ],
  Component: Guide,
}
