import type { UnitGuide } from './registry'

/**
 * P5 U14 分數除法（5B 單元五）— 目標長尾：「小五 分數除法」
 * 「分數除法 點計」「顛倒相乘 點解」。
 *
 * 內容係公開教學文章（非 UI chrome），按 i18n 規則 5 不翻譯。
 * 帶分數全文用空格寫法「1 1/4」（整數＋空格＋分數），同平台輸入格式一致。
 * 全部例題答案已獨立重解驗證（分數除以整數、整數除以分數、
 * 分數除以分數、帶分數除法、應用題）。
 */

function Guide() {
  return (
    <article className="prose-guide space-y-6 text-gray-800 leading-relaxed">
      {/* 答案前置 — AI snippet 會抽呢兩句 */}
      <p className="text-lg">
        <strong>分數除法的方法：把除數（後面那個數）上下顛倒，除號變成乘號，然後照分數乘法計算，最後約至最簡分數 — 即所謂「顛倒相乘」。</strong>
        帶分數要<strong>先化做假分數</strong>先可以顛倒。這是香港小五下學期（5B）分數除法單元的重點，
        承接 5A 的分數加減和分數乘法，也是小六分數四則混合計算的必要根基。
        本文帶分數一律用空格寫法「1 1/4」（整數＋空格＋分數），同本平台的輸入格式一致。
      </p>

      <section>
        <h2 className="text-xl font-bold text-gray-900">分數除法點樣計？</h2>
        <p>三個步驟，任何分數除法都適用：</p>
        <ol className="list-decimal pl-6 space-y-1">
          <li><strong>顛倒除數</strong>：把除號後面那個數的分子分母上下調轉（整數當分母是 1，例如 2 = 2/1，顛倒後是 1/2）</li>
          <li><strong>除號變乘號</strong>：照分數乘法計 — 分子乘分子、分母乘分母（識得斜線約簡可以先約後乘，數字細好多）</li>
          <li><strong>約至最簡</strong>：假分數按題目要求化返帶分數</li>
        </ol>
        <div className="bg-gray-50 rounded-xl p-4 mt-3 font-mono text-sm">
          <p className="font-sans font-semibold mb-2">例題一：4/5 ÷ 2（分數除以整數）</p>
          <p>2 = 2/1，顛倒後是 1/2</p>
          <p>4/5 ÷ 2 = 4/5 × 1/2 = 4/10 = <strong>2/5</strong></p>
          <p>驗算：2/5 × 2 = 4/5 ✓</p>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          貼士：只可以顛倒<strong>除數</strong>（÷ 後面那個），被除數（÷ 前面那個）原封不動。呢一步搞錯，成條題就錯。
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-gray-900">點解要顛倒相乘？</h2>
        <p>
          <strong>因為「除以一個分數」＝「問裡面有幾多個這個分數」。</strong>
          用最簡單的例子：2 ÷ 1/2 即係問「2 裡面有幾多個一半」。
          一個 1 有 2 個半，兩個 1 就有 4 個半，所以 2 ÷ 1/2 = 4 —
          同 2 × 2 的答案一模一樣。除以 1/2 等於乘 2，除以 1/4 等於乘 4：
          除數愈細，可以裝到的份數愈多，所以要用它「調轉」後的倍數去乘。
        </p>
        <p>
          再看整數除以分數：3 ÷ 3/5 = 3 × 5/3 = 15/3 = <strong>5</strong>。
          意思是「3 裡面有 5 個 3/5」（驗算：5 × 3/5 = 15/5 = 3 ✓）。
          明白呢個道理，小朋友就唔會死背口訣背到亂 — 顛倒相乘唔係魔法，係「有幾多份」的數法。
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-gray-900">分數除以分數、帶分數除法點做？</h2>
        <p>
          做法完全一樣：顛倒除數、變乘號、計乘法。唯一新增的規則是<strong>帶分數必須先化做假分數</strong>，
          先可以顛倒 — 帶分數的整數部分同分數部分係「加」的關係，唔可以分開處理。
        </p>
        <div className="bg-gray-50 rounded-xl p-4 mt-3 font-mono text-sm">
          <p className="font-sans font-semibold mb-2">例題二：5/6 ÷ 2/3（分數除以分數）</p>
          <p>顛倒除數：2/3 → 3/2</p>
          <p>5/6 × 3/2 = 15/12 = 5/4 = <strong>1 1/4</strong></p>
          <p>（先約簡更快：3 同 6 約簡，變 5/2 × 1/2 = 5/4）</p>
          <p>驗算：5/4 × 2/3 = 10/12 = 5/6 ✓</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 mt-3 font-mono text-sm">
          <p className="font-sans font-semibold mb-2">例題三：2 1/4 ÷ 3/8（帶分數除法）</p>
          <p>先化假分數：2 1/4 = (2×4+1)/4 = 9/4</p>
          <p>顛倒除數：3/8 → 8/3</p>
          <p>9/4 × 8/3 = 72/12 = <strong>6</strong></p>
          <p>（先約簡：9 同 3 約成 3，8 同 4 約成 2，3 × 2 = 6）</p>
          <p>驗算：6 × 3/8 = 18/8 = 9/4 = 2 1/4 ✓</p>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold text-gray-900">分數除法應用題點入手？</h2>
        <p>
          <strong>睇到「每份幾多」或「可以分成幾多份」，就係除法。</strong>
          總量 ÷ 每份的量 = 份數；總量 ÷ 份數 = 每份的量。
          寫橫式之前先問一句：「邊個係總量？邊個做除數？」
        </p>
        <div className="bg-gray-50 rounded-xl p-4 mt-3 font-mono text-sm">
          <p className="font-sans font-semibold mb-2">例題四：一瓶果汁有 1 1/2 升，每杯倒 1/4 升，可以倒滿多少杯？</p>
          <p>總量 ÷ 每杯的量 = 杯數</p>
          <p>1 1/2 = 3/2</p>
          <p>3/2 ÷ 1/4 = 3/2 × 4/1 = 12/2 = <strong>6 杯</strong></p>
          <p>驗算：6 × 1/4 = 6/4 = 1 1/2 ✓</p>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          貼士：計完記得答返題目問乜 — 呢題問「幾多杯」，答案要寫「6 杯」，唔係齋寫個 6。
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-gray-900">小朋友最常犯咩錯？</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>顛倒錯咗被除數</strong>：5/6 ÷ 2/3 錯做 6/5 × 2/3 = 12/15 = 4/5（正確係 1 1/4）。
            記住口訣：「<strong>前面唔郁，顛倒後面</strong>」— 只有除號後面那個數先可以調轉。
          </li>
          <li>
            <strong>帶分數未化假分數就顛倒</strong>：2 1/4 ÷ 3/8 只顛倒分數部分、或者整數同分數分開除，
            都係錯。帶分數一定要先化 9/4 先做下一步。
          </li>
          <li>
            <strong>除完唔約簡</strong>：15/12 直接交卷。香港學校批改一般要求最簡形式（5/4 或 1 1/4），唔約會扣分。
          </li>
          <li>
            <strong>忘記除號已經變咗乘號</strong>：顛倒咗除數但照用除法計，或者兩個數都顛倒。
            寫步驟時把「÷ 2/3」整行改寫做「× 3/2」，一眼睇到就唔會亂。
          </li>
          <li>
            <strong>以為「除完一定變細」</strong>：除以真分數（細過 1 的分數）答案反而<strong>變大</strong>，
            例如 3 ÷ 3/5 = 5。答案大過原本個數唔一定係錯，用乘法驗算最穩陣。
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold text-gray-900">點樣幫小朋友準備呢個單元？</h2>
        <p>
          分數除法的根基有兩層：一係 5A 的
          <a href="/resources/p5/%E7%95%B0%E5%88%86%E6%AF%8D%E5%88%86%E6%95%B8%E5%8A%A0%E6%B8%9B" className="text-[#1D9E75] font-semibold underline">異分母分數加減</a>
          （約簡、擴分要熟），二係 5A 單元三的分數乘法 — 顛倒之後成條題就係乘法，
          乘法唔穩，除法一定跟住錯。溫習時建議要求小朋友每題寫低「顛倒邊個」，
          並養成用乘法驗算的習慣（商 × 除數應該等於被除數）。
          想知道小朋友具體卡在哪一步，可以做一次
          <a href="/assessment" className="text-[#1D9E75] font-semibold underline">免費學前評估</a>
          — 20 條題目自動診斷各單元強弱項，即時出報告。其他年級單元指南可到
          <a href="/resources" className="text-[#1D9E75] font-semibold underline">學習資源索引</a>。
        </p>
      </section>

      <footer className="text-sm text-gray-400 border-t border-gray-100 pt-4">
        <p>本文由霖楓學苑數學教師團隊編寫，內容依據香港小學五年級數學課程（5B 分數除法單元）。</p>
      </footer>
    </article>
  )
}

export const p5U14FractionDivision: UnitGuide = {
  slug: '分數除法',
  grade: 5,
  unitNumber: 14,
  title: '小五數學：分數除法完全攻略（顛倒相乘原理＋例題＋常見錯誤）',
  description:
    '分數除法的方法：把除數上下顛倒、除號變乘號，照分數乘法計算，最後約至最簡，即「顛倒相乘」。本文按香港小五課程（5B 分數除法單元）講解分數除以整數、整數除以分數、分數除以分數和帶分數除法四類題型，解釋顛倒相乘點解成立，並拆解小朋友最常犯的錯誤，例如顛倒錯咗被除數、帶分數未化假分數就顛倒，幫家長在家對症溫習。',
  keywords: [
    '小五 分數除法',
    '分數除法 點計',
    '顛倒相乘 點解',
    'P5 分數除法 練習',
    '帶分數除法',
    '分數除法 應用題',
    '呈分試 分數',
  ],
  updated: '2026-07-08',
  faq: [
    {
      q: '分數除法點解要顛倒相乘？',
      a: '因為「除以一個分數」即係問「裡面有幾多個這個分數」。例如 2 ÷ 1/2 問「2 裡面有幾多個一半」：一個 1 有 2 個半，2 裡面就有 4 個，所以答案係 4，同 2 × 2 一樣。除數愈細份數愈多，所以要乘它顛倒後的數。',
    },
    {
      q: '分數除以整數點樣計？',
      a: '把整數寫成分母是 1 的分數再顛倒：例如 4/5 ÷ 2，把 2 當作 2/1，顛倒成 1/2，變成 4/5 × 1/2 = 4/10，約簡後是 2/5。',
    },
    {
      q: '帶分數除法要注意咩？',
      a: '必須先化做假分數先可以顛倒。例如 2 1/4 ÷ 3/8：先把 2 1/4 化成 9/4，再顛倒除數變 9/4 × 8/3 = 6。只顛倒分數部分或者整數分數分開除都係錯。',
    },
    {
      q: '除完之後答案大過原本個數，係咪計錯咗？',
      a: '唔一定。除以細過 1 的分數（真分數），答案會大過被除數，例如 3 ÷ 3/5 = 5。想確認啱唔啱，用乘法驗算：商 × 除數應該等於被除數（5 × 3/5 = 3 ✓）。',
    },
    {
      q: '分數除法應用題點知幾時用除法？',
      a: '見到「每份幾多」或「可以分成幾多份」就用除法：總量 ÷ 每份的量 = 份數。例如 1 1/2 升果汁每杯倒 1/4 升，1 1/2 ÷ 1/4 = 3/2 × 4 = 6 杯。',
    },
  ],
  Component: Guide,
}
