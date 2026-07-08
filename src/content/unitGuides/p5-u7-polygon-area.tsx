import type { UnitGuide } from './registry'

/**
 * P5 U7 多邊形的面積 — 單元指南（docs/seo_strategy.md §7 長尾組合
 * 「小五 面積」「平行四邊形面積公式」「梯形面積」，呈分試幾何必考單元）。
 *
 * 內容係公開教學文章（非 UI chrome），按 i18n 規則 5 不翻譯。
 * 全部例題答案已獨立重解驗證（平行四邊形、三角形、梯形、組合圖形）。
 * 純文字講解，冇圖片依賴 — 「垂直高」概念全部用文字說明。
 */

function Guide() {
  return (
    <article className="prose-guide space-y-6 text-gray-800 leading-relaxed">
      {/* 答案前置 — AI snippet 會抽呢兩句 */}
      <p className="text-lg">
        <strong>小五多邊形面積只有三條公式：平行四邊形 = 底 × 高；三角形 = 底 × 高 ÷ 2；
        梯形 = （上底 + 下底）× 高 ÷ 2。</strong>
        三條公式入面嘅「高」全部指<strong>垂直高</strong>（同底成直角嗰條線），
        絕對唔係斜邊。呢個係香港小五上學期（5A 單元七）嘅核心單元，
        建基於小四學過嘅正方形同長方形面積，亦係之後小六立體圖形體積嘅地基 —
        公式唔難背，難在「揀啱條高」同埋組合圖形點樣拆。
      </p>

      <section>
        <h2 className="text-xl font-bold text-gray-900">平行四邊形面積公式係乜？點解係底×高？</h2>
        <p>
          <strong>平行四邊形面積 = 底 × 高。</strong>
          想像沿住條垂直高剪走平行四邊形一邊嘅三角形，砌返去另一邊，
          就變咗一個長方形 — 長就係底，闊就係高。所以公式同長方形一樣，係「底 × 高」。
          最大陷阱：題目通常會<strong>同時</strong>俾埋斜邊（即係打斜嗰條邊）嘅長度，
          引小朋友用斜邊嚟乘。記住：高係由頂到底、同底<strong>成直角</strong>嘅距離，
          斜邊永遠比高長，用斜邊計出嚟嘅面積一定偏大。
        </p>
        <div className="bg-gray-50 rounded-xl p-4 mt-3 font-mono text-sm">
          <p className="font-sans font-semibold mb-2">
            例題一：一個平行四邊形，底是 12 cm，斜邊是 9 cm，垂直高是 7 cm，面積是多少？
          </p>
          <p>面積 = 底 × 高 = 12 × 7 = <strong>84 cm²</strong></p>
          <p>（斜邊 9 cm 係干擾資料，唔使用；12 × 9 = 108 cm² 係錯㗎）</p>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          貼士：叫小朋友做題前先圈住「高」字，見到兩個數就要停一停諗：邊個先係垂直高？
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-gray-900">三角形面積點計？點解要除 2？</h2>
        <p>
          <strong>三角形面積 = 底 × 高 ÷ 2。</strong>
          點解要除 2？因為兩個一模一樣嘅三角形，掉轉其中一個拼埋一齊，
          啱啱好砌成一個平行四邊形。平行四邊形面積係底 × 高，
          一個三角形只係佢嘅一半，所以要除 2。
          例如底 10 cm、高 6 cm 嘅三角形：10 × 6 = 60，60 ÷ 2 = <strong>30 cm²</strong>。
          同平行四邊形一樣，「高」必須係由頂點垂直落到底邊（或者底邊延長線）嘅距離；
          鈍角三角形嘅高可能落喺三角形外面，呢個唔係計錯，係正常現象。
        </p>
        <p className="text-sm text-gray-500 mt-2">
          自我檢查：三角形面積一定<strong>細過</strong>「底 × 高」— 如果答案同底 × 高一樣大，
          即係唔記得除 2。
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-gray-900">梯形面積公式點記？上底下底調轉有冇影響？</h2>
        <p>
          <strong>梯形面積 = （上底 + 下底）× 高 ÷ 2。</strong>
          記法：兩個一樣嘅梯形，一正一倒拼埋，變成一個底係「上底 + 下底」嘅平行四邊形，
          所以先加、後乘高、再除 2。因為上底加下底係加法，
          <strong>上底同下底調轉冇影響</strong>（6 + 10 同 10 + 6 一樣）—
          但係「高」就唔可以同兩條打斜嘅腰搞混，高一定係上下底之間嘅垂直距離。
        </p>
        <div className="bg-gray-50 rounded-xl p-4 mt-3 font-mono text-sm">
          <p className="font-sans font-semibold mb-2">
            例題二：一塊梯形菜地，上底 6 m，下底 10 m，高 5 m，面積是多少？
          </p>
          <p>上底 + 下底 = 6 + 10 = 16 (m)</p>
          <p>面積 = 16 × 5 ÷ 2 = 80 ÷ 2 = <strong>40 m²</strong></p>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          留意運算次序：括號入面先加，之後乘高，最後除 2；漏咗括號直接「6 + 10 × 5」就會計錯。
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-gray-900">組合圖形面積點樣拆？</h2>
        <p>
          <strong>組合圖形冇新公式 — 拆開做識計嘅圖形，逐個計，再加埋（或者減走）。</strong>
          步驟：①用直線將圖形分割成長方形、三角形、平行四邊形或梯形；
          ②搵齊每個小圖形嘅底同高（有時要用減法先求到隱藏嘅邊長）；
          ③逐個計面積；④全部加埋。如果圖形係「大圖形挖走一忽」，就用大面積減細面積。
        </p>
        <div className="bg-gray-50 rounded-xl p-4 mt-3 font-mono text-sm">
          <p className="font-sans font-semibold mb-2">
            例題三：一個「屋形」圖案，下半部是闊 8 m、高 5 m 的長方形，
            上半部是一個三角形屋頂，底同長方形一樣闊（8 m），高 3 m。整個圖案面積是多少？
          </p>
          <p>長方形面積 = 8 × 5 = 40 (m²)</p>
          <p>三角形面積 = 8 × 3 ÷ 2 = 24 ÷ 2 = 12 (m²)</p>
          <p>總面積 = 40 + 12 = <strong>52 m²</strong></p>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          貼士：拆完之後叫小朋友數一數 — 每一忽都計咗？有冇一忽計咗兩次？呢兩句自問自答慳好多冤枉分。
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-gray-900">小朋友最常犯咩錯？</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>三角形唔記得 ÷ 2</strong>：計咗底 × 高就收工，答案大咗一倍。
            背口訣「三角一半」— 見三角形，最後一步一定係除 2。
          </li>
          <li>
            <strong>用斜邊當高</strong>：平行四邊形同梯形題目最愛俾埋斜邊長度做干擾。
            高必須同底成直角；斜邊永遠長過高，攞嚟計面積一定錯。
          </li>
          <li>
            <strong>梯形嘅高同腰搞混</strong>：上底下底調轉冇問題（加法次序唔影響），
            但條「高」一定係上下底之間嘅垂直距離，唔係打斜嗰兩條腰。
          </li>
          <li>
            <strong>單位寫 cm 唔係 cm²</strong>：面積係「平方」單位 — cm²、m²。
            答案寫「84 cm」直接冇分，因為 cm 係長度單位。
          </li>
          <li>
            <strong>組合圖形漏計或者重複計</strong>：拆完之後冇核對，成忽圖形冇計到，
            或者中間嗰忽計咗兩次。計完逐忽剔一次先寫答案。
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold text-gray-900">點樣幫小朋友溫好呢個單元？</h2>
        <p>
          呢個單元嘅地基係小四（4B 單元十六）嘅「正方形和長方形面積」—
          長 × 闊要計得穩，先至接得住「剪一剪變長方形」呢條推理鏈。
          在家溫習可以咁做：每條公式唔好淨係背，要求小朋友講得出「點解」
          （平行四邊形點解係底 × 高？三角形點解除 2？），講唔出就係未真識；
          做題時養成「先圈高、後計數、最後查單位」三步習慣。
          想知道小朋友係卡喺公式、卡喺揀高，定係卡喺組合圖形拆解，可以做一次
          <a href="/assessment" className="text-[#1D9E75] font-semibold underline">免費學前評估</a>
          — 20 條題目自動診斷各單元強弱項，即時出報告。同年級亦可以睇
          <a href="/resources/p5/%E7%95%B0%E5%88%86%E6%AF%8D%E5%88%86%E6%95%B8%E5%8A%A0%E6%B8%9B" className="text-[#1D9E75] font-semibold underline">小五異分母分數加減攻略</a>，
          其他年級單元指南可到
          <a href="/resources" className="text-[#1D9E75] font-semibold underline">學習資源索引</a>。
        </p>
      </section>

      <footer className="text-sm text-gray-400 border-t border-gray-100 pt-4">
        <p>本文由霖楓學苑數學教師團隊編寫，內容依據香港小學五年級數學課程（5A 單元七）。</p>
      </footer>
    </article>
  )
}

export const p5U7PolygonArea: UnitGuide = {
  slug: '多邊形的面積',
  grade: 5,
  unitNumber: 7,
  title: '小五數學：多邊形面積完全攻略（平行四邊形＋三角形＋梯形公式例題）',
  description:
    '多邊形面積三條公式：平行四邊形＝底×高，三角形＝底×高÷2，梯形＝（上底＋下底）×高÷2，而「高」必須是垂直高，不是斜邊。本文按香港小五課程（5A 單元七）逐條公式講解點解咁計，附完整步驟例題和組合圖形拆解示範，並剖析小朋友最常犯的錯誤，例如三角形唔記得除2、用斜邊當高、面積單位漏寫平方，幫家長在家對症溫習。',
  keywords: [
    '平行四邊形面積公式',
    '三角形面積 點計',
    '梯形面積',
    '小五 面積',
    'P5 數學 多邊形面積',
    '組合圖形 面積',
    '呈分試 面積',
  ],
  updated: '2026-07-08',
  faq: [
    {
      q: '平行四邊形面積公式係乜？',
      a: '平行四邊形面積 = 底 × 高。「高」必須係同底成直角嘅垂直高，唔係斜邊。例如底 12 cm、垂直高 7 cm：面積 = 12 × 7 = 84 cm²，就算題目話斜邊係 9 cm 都唔使用。',
    },
    {
      q: '三角形面積點解要除 2？',
      a: '因為兩個一樣嘅三角形拼埋啱啱好係一個平行四邊形，一個三角形只係佢嘅一半。所以三角形面積 = 底 × 高 ÷ 2，例如底 10 cm、高 6 cm：10 × 6 ÷ 2 = 30 cm²。',
    },
    {
      q: '梯形面積公式係乜？上底下底調轉有冇影響？',
      a: '梯形面積 = （上底 + 下底）× 高 ÷ 2。上底同下底調轉冇影響，因為加法次序唔影響結果；但「高」一定係上下底之間嘅垂直距離，唔可以用打斜嘅腰代替。',
    },
    {
      q: '面積單位應該寫 cm 定 cm²？',
      a: '面積一定用平方單位：cm²、m²。cm 同 m 係長度單位，用嚟寫面積答案會直接冇分。周界先至用 cm 或 m。',
    },
    {
      q: '咩係垂直高？斜邊可唔可以當高？',
      a: '垂直高係由頂（或上底）垂直落到底邊、同底成直角嘅距離。斜邊唔可以當高 — 斜邊永遠長過垂直高，用斜邊計面積一定偏大。題目同時俾斜邊同高，就係想考小朋友識唔識揀。',
    },
  ],
  Component: Guide,
}
