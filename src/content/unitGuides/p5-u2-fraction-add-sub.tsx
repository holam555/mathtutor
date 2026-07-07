import type { UnitGuide } from './registry'

/**
 * P5 U2 異分母分數加法和減法 — 首篇單元指南（docs/seo_strategy.md §7
 * 關鍵詞地圖入面搜尋量最高嘅長尾組合之一）。
 *
 * 內容係公開教學文章（非 UI chrome），按 i18n 規則 5 不翻譯。
 * 帶分數在文章正文用「2又1/3」寫法方便家長閱讀；app 輸入用 space form
 * （2 1/3），文中有註明。
 */

function Guide() {
  return (
    <article className="prose-guide space-y-6 text-gray-800 leading-relaxed">
      {/* 答案前置 — AI snippet 會抽呢兩句 */}
      <p className="text-lg">
        <strong>異分母分數加減的方法：先通分（把兩個分母化成相同），再把分子相加或相減，最後約至最簡分數。</strong>
        通分時用兩個分母的<strong>最小公倍數（LCM）</strong>做新分母最快捷。
        這是香港小五上學期（5A）第二個大單元，也是之後分數乘除、小數互化的基礎。
      </p>

      <section>
        <h2 className="text-xl font-bold text-gray-900">異分母分數點樣加？</h2>
        <p>三個步驟：</p>
        <ol className="list-decimal pl-6 space-y-1">
          <li><strong>搵最小公倍數</strong>：兩個分母的 LCM 做新分母</li>
          <li><strong>擴分</strong>：分母乘幾多，分子就要乘幾多</li>
          <li><strong>分子相加，約簡</strong>：分母不變，只加分子；結果化最簡</li>
        </ol>
        <div className="bg-gray-50 rounded-xl p-4 mt-3 font-mono text-sm">
          <p className="font-sans font-semibold mb-2">例題一：1/4 + 1/6</p>
          <p>4 和 6 的最小公倍數是 12</p>
          <p>1/4 = 3/12，1/6 = 2/12</p>
          <p>3/12 + 2/12 = <strong>5/12</strong>（已是最簡）</p>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          貼士：直接把兩個分母相乘（4×6=24）都可以通分，但數字會大，之後要多做一步約簡，容易出錯。
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-gray-900">異分母分數點樣減？</h2>
        <p>步驟和加法完全一樣，只是最後把分子相減：</p>
        <div className="bg-gray-50 rounded-xl p-4 mt-3 font-mono text-sm">
          <p className="font-sans font-semibold mb-2">例題二：5/6 − 1/4</p>
          <p>6 和 4 的最小公倍數是 12</p>
          <p>5/6 = 10/12，1/4 = 3/12</p>
          <p>10/12 − 3/12 = <strong>7/12</strong></p>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold text-gray-900">帶分數加減點樣處理？</h2>
        <p>
          整數部分和分數部分分開處理；分數部分照樣通分。加法如果分數部分「爆咗」（假分數），要進位到整數。
        </p>
        <div className="bg-gray-50 rounded-xl p-4 mt-3 font-mono text-sm">
          <p className="font-sans font-semibold mb-2">例題三：2又1/3 + 1又3/4</p>
          <p>分數部分：1/3 = 4/12，3/4 = 9/12</p>
          <p>4/12 + 9/12 = 13/12 = 1又1/12（進位）</p>
          <p>整數部分：2 + 1 = 3，再加進位的 1</p>
          <p>答案：<strong>4又1/12</strong></p>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          註：本平台練習輸入帶分數時用空格寫法「4 1/12」（整數＋空格＋分數）。
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-gray-900">小朋友最常犯咩錯？</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>分母直接相加</strong>：1/4 + 1/6 寫成 2/10。這是最普遍的錯誤 —
            分母代表「每份有多大」，唔同大小的份數不能直接加。
          </li>
          <li>
            <strong>只擴分母、唔擴分子</strong>：1/4 寫成 1/12。記住口訣「分母乘幾多，分子跟住乘」。
          </li>
          <li>
            <strong>唔約到最簡分數</strong>：答案寫 6/12 而不是 1/2。香港學校批改一般要求最簡形式，會扣分。
          </li>
          <li>
            <strong>帶分數減法唔識借位</strong>：3又1/4 − 1又3/4，分數部分 1/4 唔夠減 3/4，
            要從整數借 1（3又1/4 = 2又5/4），變成 2又5/4 − 1又3/4 = 1又2/4 = 1又1/2。
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold text-gray-900">點樣幫小朋友練好呢個單元？</h2>
        <p>
          異分母分數加減的根基是<strong>最小公倍數</strong>（P5 U1 之前在 P4 已學過倍數）。
          如果小朋友通分步驟卡住，通常是 LCM 未熟，建議先回頭練公倍數。
          想知道小朋友具體卡在哪一步，可以做一次
          <a href="/assessment" className="text-[#1D9E75] font-semibold underline">免費學前評估</a>
          — 20 條題目自動診斷各單元強弱項，即時出報告。
        </p>
      </section>

      <footer className="text-sm text-gray-400 border-t border-gray-100 pt-4">
        <p>本文由霖楓學苑數學教師團隊編寫，內容依據香港小學五年級數學課程（5A 單元二）。</p>
      </footer>
    </article>
  )
}

export const p5U2FractionAddSub: UnitGuide = {
  slug: '異分母分數加減',
  grade: 5,
  unitNumber: 2,
  title: '小五數學：異分母分數加減完全攻略（通分方法＋例題＋常見錯誤）',
  description:
    '異分母分數加減要先通分：用兩個分母的最小公倍數做新分母，擴分後再把分子相加減，最後約至最簡。本文以香港小五課程（5A 單元二）步驟講解，附三條例題、帶分數借位示範，以及小朋友最常犯的四個錯誤。',
  keywords: [
    '小五 數學 分數',
    '異分母分數加減',
    '通分 方法',
    '最小公倍數 分數',
    'P5 分數 練習',
    '帶分數 加減',
  ],
  updated: '2026-07-06',
  faq: [
    {
      q: '異分母分數點樣加？',
      a: '先用兩個分母的最小公倍數通分，擴分時分母乘幾多分子就乘幾多，然後分子相加、分母不變，最後約至最簡分數。例如 1/4 + 1/6 = 3/12 + 2/12 = 5/12。',
    },
    {
      q: '通分一定要用最小公倍數嗎？',
      a: '不一定，直接把兩個分母相乘也可以通分，但數字較大、之後要多做約簡，容易出錯。用最小公倍數（LCM）是最快捷和最少錯誤的方法。',
    },
    {
      q: '帶分數減法分數部分唔夠減點算？',
      a: '從整數部分借 1 化做假分數再減。例如 3又1/4 − 1又3/4：把 3又1/4 寫成 2又5/4，然後 2又5/4 − 1又3/4 = 1又2/4 = 1又1/2。',
    },
    {
      q: '小朋友異分母分數成日錯，應該點補底？',
      a: '最常見根源是最小公倍數未熟——通分自然錯。建議先回頭練公倍數，再做分數加減。可以用免費學前評估找出具體卡在哪一步。',
    },
  ],
  Component: Guide,
}
