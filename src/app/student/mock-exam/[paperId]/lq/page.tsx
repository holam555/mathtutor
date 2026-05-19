import { redirect, notFound } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { MARKS, formatMarks } from '@/lib/mockExamMarks'

const GRADE_LABEL: Record<number, string> = { 3: '小三', 4: '小四', 5: '小五', 6: '小六' }

export default async function LqPaperPage({
  params,
  searchParams,
}: {
  params: { paperId: string }
  searchParams: { view?: 'question' | 'answer' }
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login/student')

  const service = createServiceClient()

  const { data: paper } = await service
    .from('mock_exam_papers')
    .select('id, student_id, lq_question_ids, exam_scope_id, created_at')
    .eq('id', params.paperId)
    .single()

  if (!paper) notFound()

  // Allow the student or any parent linked to that student to view.
  if (paper.student_id !== user.id) {
    const { data: link } = await service
      .from('parent_student_relationships')
      .select('id')
      .eq('parent_id', user.id)
      .eq('student_id', paper.student_id)
      .eq('is_active', true)
      .maybeSingle()
    const role = user.user_metadata?.role
    if (!link && role !== 'teacher') redirect('/student')
  }

  const view = searchParams.view === 'answer' ? 'answer' : 'question'

  const [{ data: student }, { data: scope }, { data: lqs }] = await Promise.all([
    service
      .from('student_profiles')
      .select('name, grade')
      .eq('id', paper.student_id)
      .single(),
    paper.exam_scope_id
      ? service
          .from('exam_scopes')
          .select('exam_name, exam_date')
          .eq('id', paper.exam_scope_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    paper.lq_question_ids?.length
      ? service
          .from('long_questions')
          .select('id, question_text, model_answer, image_url')
          .in('id', paper.lq_question_ids)
      : Promise.resolve({ data: [] as Array<{ id: string; question_text: string; model_answer: string; image_url: string | null }> }),
  ])

  type Lq = { id: string; question_text: string; model_answer: string; image_url: string | null }

  // Sign any private-storage image URLs
  const signedLqs: Lq[] = await Promise.all(
    ((lqs ?? []) as Lq[]).map(async (q: Lq): Promise<Lq> => {
      const original = q.image_url
      if (!original) return q
      let url: string | null = original
      if (!original.startsWith('https://')) {
        const { data } = await service.storage.from('past-papers').createSignedUrl(original, 3600)
        url = data?.signedUrl ?? null
      } else if (original.includes('/object/public/past-papers/') && !original.includes('token=')) {
        const marker = '/object/public/past-papers/'
        const path = decodeURIComponent(original.slice(original.indexOf(marker) + marker.length))
        const { data } = await service.storage.from('past-papers').createSignedUrl(path, 3600)
        url = data?.signedUrl ?? null
      }
      return { ...q, image_url: url }
    })
  )

  // Preserve original order from lq_question_ids
  const lqById = new Map<string, Lq>(signedLqs.map((q: Lq): [string, Lq] => [q.id, q]))
  const orderedLqs: Lq[] = (paper.lq_question_ids ?? [])
    .map((id: string) => lqById.get(id))
    .filter((q: Lq | undefined): q is Lq => q != null)

  const paperDate = new Date(paper.created_at).toLocaleDateString('zh-Hant-HK')

  return (
    <>
      <style
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: `
            @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&display=swap');
            body, .lq-doc {
              font-family: 'Noto Sans TC', '微軟正黑體', 'Microsoft JhengHei', 'PingFang TC', sans-serif;
              color: #111;
            }
            .lq-doc { max-width: 720px; margin: 0 auto; padding: 24px; line-height: 1.7; }
            .lq-header { border-bottom: 2px solid #111; padding-bottom: 10px; margin-bottom: 18px; }
            .lq-title { font-size: 22px; font-weight: 700; }
            .lq-meta { display: flex; justify-content: space-between; flex-wrap: wrap; font-size: 13px; color: #444; margin-top: 6px; }
            .lq-instr { font-size: 12px; color: #555; margin: 8px 0 16px; padding: 8px 12px; background: #f7f7f7; border-left: 3px solid #999; }
            .lq-q { margin: 0 0 22px; page-break-inside: avoid; }
            .lq-q-head { display: flex; gap: 8px; align-items: baseline; margin-bottom: 4px; }
            .lq-num { font-weight: 700; font-size: 15px; }
            .lq-marks { font-size: 12px; color: #666; }
            .lq-text { font-size: 14px; white-space: pre-wrap; }
            .lq-img { max-width: 320px; margin: 6px 0; border: 1px solid #ddd; }
            .lq-ans-box { border: 1px dashed #aaa; min-height: 120px; margin-top: 8px; padding: 8px; font-size: 12px; color: #aaa; }
            .lq-model-ans { margin-top: 8px; padding: 10px 12px; background: #fff7e6; border-left: 3px solid #EF9F27; white-space: pre-wrap; font-size: 13px; }
            .lq-print-btn { position: fixed; top: 12px; right: 12px; padding: 8px 14px; background: #4A90E2; color: white; border-radius: 8px; font-size: 13px; cursor: pointer; border: 0; }
            @media print {
              .lq-print-btn { display: none; }
              body { background: white; }
              .lq-doc { padding: 12px; }
              .lq-q { page-break-inside: avoid; }
              @page { size: A4; margin: 14mm; }
            }
          `,
        }}
      />
      <button className="lq-print-btn" id="lq-print-btn" type="button">
        🖨 列印
      </button>
      <PrintButtonScript />

      <div className="lq-doc">
        <div className="lq-header">
          <div className="lq-title">
            模擬考試試卷 · 長答題部分{view === 'answer' ? '（答案）' : ''}
          </div>
          <div className="lq-meta">
            <span>
              {student?.name ?? ''}（{student?.grade ? GRADE_LABEL[student.grade] : ''}）
            </span>
            <span>
              {scope?.exam_name ? scope.exam_name + ' · ' : ''}
              {scope?.exam_date ? `考試日期 ${scope.exam_date}` : `生成日期 ${paperDate}`}
            </span>
          </div>
          <div className="lq-meta">
            <span>共 {orderedLqs.length} 題</span>
            <span>滿分 {formatMarks(orderedLqs.length * MARKS.lq)} 分（每題 {formatMarks(MARKS.lq)} 分）</span>
          </div>
        </div>

        {view === 'question' && (
          <div className="lq-instr">
            指示：請在每題下方空格內寫出完整解題步驟及最終答案。完成後請家長協助拍照上載。
          </div>
        )}

        {orderedLqs.map((q: Lq, idx: number) => (
          <div key={q.id} className="lq-q">
            <div className="lq-q-head">
              <span className="lq-num">{idx + 1}.</span>
              <span className="lq-marks">（{formatMarks(MARKS.lq)} 分）</span>
            </div>
            <div className="lq-text">{q.question_text}</div>
            {q.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={q.image_url} alt="題目圖片" className="lq-img" />
            )}
            {view === 'question' ? (
              <div className="lq-ans-box">作答空間</div>
            ) : (
              <div className="lq-model-ans">{q.model_answer}</div>
            )}
          </div>
        ))}

        {orderedLqs.length === 0 && (
          <p style={{ color: '#888', textAlign: 'center', padding: '40px 0' }}>
            此試卷暫無長答題
          </p>
        )}
      </div>
    </>
  )
}

function PrintButtonScript() {
  return (
    <script
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{
        __html: `
          (function() {
            function bind() {
              var btn = document.getElementById('lq-print-btn');
              if (btn) btn.addEventListener('click', function() { window.print(); });
            }
            if (document.readyState === 'loading') {
              document.addEventListener('DOMContentLoaded', bind);
            } else { bind(); }
          })();
        `,
      }}
    />
  )
}
