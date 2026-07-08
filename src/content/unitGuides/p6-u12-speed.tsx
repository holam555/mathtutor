import type { UnitGuide } from './registry'

/**
 * P6 U12 速率與行程圖 — 第三篇單元指南（docs/seo_strategy.md §7 長尾組合
 * 「小六 速率」「行程圖 點睇」，呈分試高頻考點）。
 *
 * 內容係公開教學文章（非 UI chrome），按 i18n 規則 5 不翻譯。
 * 全部例題答案已獨立重解驗證（求速率、求時間、行程圖判讀、平均速率）。
 * 行程圖用文字描述判讀技巧，不含圖片。
 */

function Guide() {
  return (
    <article className="prose-guide space-y-6 text-gray-800 leading-relaxed">
      {/* 答案前置 — AI snippet 會抽呢兩句 */}
      <p className="text-lg">
        <strong>速率 = 距離 ÷ 時間</strong>，由此推出<strong>距離 = 速率 × 時間</strong>、
        <strong>時間 = 距離 ÷ 速率</strong> — 三條公式其實係同一條嘅變形。
        呢個係香港小六下學期（6B 單元十二）嘅重點單元，呈分試常考公式計算、
        行程圖判讀同平均速率陷阱三類題。最多學生跌分嘅唔係公式而係<strong>單位</strong> —
        45 分鐘要先化做 0.75 小時先可以代入。
      </p>

      <section>
        <h2 className="text-xl font-bold text-gray-900">速率係乜嘢？公式點樣記？</h2>
        <p>
          <strong>速率表示「一個單位時間內行咗幾遠」</strong>，所以速率 = 距離 ÷ 時間。
          小六常用兩個單位：<strong>公里/小時（km/h）</strong>同<strong>米/秒（m/s）</strong>，
          即係「每小時行幾多公里」「每秒行幾多米」。
        </p>
        <div className="bg-gray-50 rounded-xl p-4 mt-3 font-mono text-sm">
          <p className="font-sans font-semibold mb-2">例題一：一列火車 3 小時行了 240 公里，速率是多少？</p>
          <p>速率 = 距離 ÷ 時間</p>
          <p>= 240 ÷ 3 = <strong>80 公里/小時（km/h）</strong></p>
          <p className="mt-2 font-sans font-semibold mb-1">再一題：小華跑 100 米用了 20 秒，速率是多少？</p>
          <p>速率 = 100 ÷ 20 = <strong>5 米/秒（m/s）</strong></p>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          記法貼士：三條公式只有<strong>求距離先用乘法</strong>，其餘兩條都係除法。
          答題時單位要寫齊（公里/小時），淨寫數字會被扣分。
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-gray-900">求時間或距離時，單位唔一致點算？</h2>
        <p>
          <strong>先統一單位，再代入公式。</strong>速率係「公里/小時」，時間就必須用「小時」：
          45 分鐘 = 45 ÷ 60 = 0.75 小時；30 分鐘 = 0.5 小時；15 分鐘 = 0.25 小時。
        </p>
        <div className="bg-gray-50 rounded-xl p-4 mt-3 font-mono text-sm">
          <p className="font-sans font-semibold mb-2">例題二：一輛巴士以每小時 48 公里行駛，行 36 公里需要多少分鐘？</p>
          <p>時間 = 距離 ÷ 速率 = 36 ÷ 48 = 0.75 小時</p>
          <p>0.75 × 60 = <strong>45 分鐘</strong></p>
          <p>驗算：48 × 0.75 = 36 ✓</p>
          <p className="mt-2 font-sans font-semibold mb-1">例題三：小美以每小時 4 公里步行 45 分鐘，行了多遠？</p>
          <p>45 分鐘 = 45 ÷ 60 = 0.75 小時</p>
          <p>距離 = 速率 × 時間 = 4 × 0.75 = <strong>3 公里</strong></p>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          自我檢查：例題三直接用 45 代入會計出 4 × 45 = 180 公里 —
          步行 45 分鐘點會行到 180 公里？計完諗一諗合唔合理，好多錯就咁避到。
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-gray-900">行程圖點樣睇？</h2>
        <p>
          <strong>行程圖橫軸係時間，縱軸係距離，記住三個口訣：線向上斜 = 行緊；
          水平線段 = 停低咗（時間過緊但距離冇變）；斜度越斜 = 行得越快。</strong>
          考試只要求識比較邊段較斜、邊段係水平，再用公式計每段速率。
        </p>
        <div className="bg-gray-50 rounded-xl p-4 mt-3 font-mono text-sm">
          <p className="font-sans font-semibold mb-2">
            例題四：小明的行程圖顯示 — 佢 9:00 由屋企出發，9:30 到達 6 公里外的公園；
            9:30 至 9:45 圖上是一段水平線；9:45 再出發，10:15 到達 9 公里外的圖書館。
          </p>
          <p>第一段：6 公里 ÷ 0.5 小時 = 12 公里/小時</p>
          <p>第二段：水平線 = 停低休息咗 15 分鐘，速率 = 0</p>
          <p>第三段：(9 − 6) ÷ 0.5 = 3 ÷ 0.5 = 6 公里/小時</p>
          <p>邊段最快？第一段（12 公里/小時）— 圖上呢段斜度最斜</p>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          睇圖步驟：①先睇兩軸單位 ②讀出每段起點終點 ③每段分開計 —
          第三段嘅距離係 9 − 6 = 3 公里，唔係 9 公里。
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-gray-900">平均速率係咪兩個速率嘅平均？</h2>
        <p>
          <strong>唔係！平均速率 = 總距離 ÷ 總時間</strong>，唔可以將兩個速率加埋除二。
          因為行得慢嗰程用嘅時間多啲，平均速率會偏向慢嗰邊。
        </p>
        <div className="bg-gray-50 rounded-xl p-4 mt-3 font-mono text-sm">
          <p className="font-sans font-semibold mb-2">
            例題五：爸爸駕車去 120 公里外的酒店，去程速率是每小時 60 公里，
            回程速率是每小時 40 公里。來回全程的平均速率是多少？
          </p>
          <p>去程時間 = 120 ÷ 60 = 2 小時</p>
          <p>回程時間 = 120 ÷ 40 = 3 小時</p>
          <p>總距離 = 120 + 120 = 240 公里；總時間 = 2 + 3 = 5 小時</p>
          <p>平均速率 = 240 ÷ 5 = <strong>48 公里/小時</strong></p>
          <p>（錯誤做法：(60 + 40) ÷ 2 = 50 — 唔啱！）</p>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          例題四都一樣：全程 9 公里 ÷ 1.25 小時 = 7.2 公里/小時 —
          停低嗰 15 分鐘都要計入總時間。
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-gray-900">小朋友最常犯咩錯？</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>單位唔一致就直接除</strong>：速率係公里/小時但時間畀分鐘，照拎嚟計。
            口訣：<strong>「先睇單位，後郁筆」</strong>— 分鐘 ÷ 60 化做小時先。
          </li>
          <li>
            <strong>平均速率求兩速率嘅平均</strong>：(60 + 40) ÷ 2 係最常見錯法。
            平均速率一律用<strong>總距離 ÷ 總時間</strong>，冇例外。
          </li>
          <li>
            <strong>行程圖水平段當做行緊</strong>：水平線代表停低咗 — 時間過緊但距離冇變。
            計平均速率時停低嘅時間都要計入總時間。
          </li>
          <li>
            <strong>求時間用咗乘法</strong>：時間 = 距離 ÷ 速率。三條公式只有求距離用乘法。
          </li>
          <li>
            <strong>行程圖每段用「總距離」計</strong>：第二段嘅距離係「終點讀數 − 起點讀數」，
            唔係縱軸最尾嗰個數。
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold text-gray-900">點樣幫小朋友準備呈分試呢個單元？</h2>
        <p>
          速率嘅根基係小數乘除同時間單位換算 — 45 分鐘化 0.75 小時呢啲要計得穩。
          建議每類題型（求速率、求時間、求距離、行程圖、平均速率）各練幾條，
          做嗰陣要求小朋友<strong>先檢查單位一致咗未</strong>再代公式。
          想知道小朋友具體卡在哪一類，可以做一次
          <a href="/assessment" className="text-[#1D9E75] font-semibold underline">免費學前評估</a>
          — 20 條題目自動診斷各單元強弱項，即時出報告。同年級亦可睇
          <a href="/resources/p6/%E7%99%BE%E5%88%86%E6%95%B8%E6%87%89%E7%94%A8" className="text-[#1D9E75] font-semibold underline">小六百分數應用攻略</a>，
          更多指南見
          <a href="/resources" className="text-[#1D9E75] font-semibold underline">學習資源索引</a>。
        </p>
      </section>

      <footer className="text-sm text-gray-400 border-t border-gray-100 pt-4">
        <p>本文由霖楓學苑數學教師團隊編寫，內容依據香港小學六年級數學課程（6B 單元十二）。</p>
      </footer>
    </article>
  )
}

export const p6U12Speed: UnitGuide = {
  slug: '速率與行程圖',
  grade: 6,
  unitNumber: 12,
  title: '小六數學：速率與行程圖完全攻略（公式＋行程圖判讀例題）',
  description:
    '速率 = 距離 ÷ 時間，距離 = 速率 × 時間，時間 = 距離 ÷ 速率，三條公式互通。本文按香港小六課程（6B 單元十二）講解速率計算、單位換算（45 分鐘先化做 0.75 小時）、行程圖判讀（水平線段＝停低、越斜越快）同平均速率陷阱 — 要用總距離除以總時間。每類附步驟例題，拆解小朋友常犯錯誤，幫家長對症溫習。',
  keywords: [
    '小六 速率',
    'P6 速率',
    '速率 公式',
    '行程圖 點睇',
    '距離 時間 速率',
    '平均速率 計算',
    '呈分試 速率',
  ],
  updated: '2026-07-08',
  faq: [
    {
      q: '速率的公式是甚麼？',
      a: '速率 = 距離 ÷ 時間。由此推出距離 = 速率 × 時間、時間 = 距離 ÷ 速率。例如 3 小時行 240 公里，速率 = 240 ÷ 3 = 80 公里/小時。小六常用單位係公里/小時（km/h）同米/秒（m/s）。',
    },
    {
      q: '題目畀 45 分鐘，應該點樣代入速率公式？',
      a: '如果速率單位係公里/小時，時間必須先化做小時：45 分鐘 = 45 ÷ 60 = 0.75 小時。例如以每小時 4 公里步行 45 分鐘，距離 = 4 × 0.75 = 3 公里，唔可以直接用 45 去乘。',
    },
    {
      q: '行程圖上水平嘅線段代表乜嘢？',
      a: '代表停低咗冇郁 — 時間繼續過但距離冇變，所以呢段嘅速率係 0。留意計全程平均速率時，停低嘅時間都要計入總時間。',
    },
    {
      q: '行程圖點樣睇邊一段行得最快？',
      a: '斜度越斜嘅線段行得越快。準確做法係每段分開計：用「呢段行咗嘅距離 ÷ 呢段用咗嘅時間」，邊段計出嚟嘅速率最大，邊段就最快。',
    },
    {
      q: '平均速率係咪將兩個速率加埋除二？',
      a: '唔係。平均速率 = 總距離 ÷ 總時間。例如去程 120 公里以 60 公里/小時行（2 小時），回程以 40 公里/小時行（3 小時），平均速率 = 240 ÷ 5 = 48 公里/小時，唔係 (60 + 40) ÷ 2 = 50。',
    },
  ],
  Component: Guide,
}
