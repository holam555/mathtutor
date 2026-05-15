import type { ReportData } from '@/types/assessment'

type AssessmentNotificationPayload = {
  sessionId: string
  studentName: string
  gradeLevel: string
  schoolName: string | null
  parentPhone: string | null
  parentEmail: string | null
  score: number
  totalCorrect: number
  totalQuestions: number
  reportData: ReportData
}

function buildEmailHtml(p: AssessmentNotificationPayload, reportUrl: string): string {
  const weakAreas = (p.reportData.weakAreas ?? [])
  const scoreColor = p.score >= 80 ? '#1D9E75' : p.score >= 60 ? '#F59E0B' : '#EF4444'
  const tier = p.reportData.diagnosticTier
  const tierLabel = tier === 'advanced' ? '🎯 拔尖' : tier === 'basic_mastery' ? '📚 基礎' : tier === 'weak' ? '⚠️ 補強' : ''

  const weakRows = weakAreas.map((a) => {
    const dot = a.priority === '急需加強' ? '#EF4444' : a.priority === '需要加強' ? '#F59E0B' : '#3B82F6'
    return `
      <tr>
        <td style="padding:6px 0; font-size:13px; color:#374151;">${a.name}</td>
        <td style="padding:6px 0; font-size:13px; font-weight:600; color:${dot};">${a.priority}</td>
      </tr>`
  }).join('')

  return `<!DOCTYPE html>
<html lang="zh-HK">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F3F4F6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#1D9E75 0%,#0E7CBF 100%);padding:28px 32px;">
      <p style="margin:0;color:rgba(255,255,255,0.8);font-size:12px;letter-spacing:2px;text-transform:uppercase;">霖楓學苑 · 新評估通知</p>
      <h1 style="margin:8px 0 0;color:#fff;font-size:22px;font-weight:700;">有新學生完成學前評估</h1>
    </div>

    <!-- Student info -->
    <div style="padding:24px 32px 0;">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:8px 0;font-size:13px;color:#6B7280;width:90px;">學生姓名</td>
          <td style="padding:8px 0;font-size:15px;font-weight:600;color:#111827;">${p.studentName}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-size:13px;color:#6B7280;">年級</td>
          <td style="padding:8px 0;font-size:15px;color:#111827;">${p.gradeLevel}${tierLabel ? `　<span style="font-size:12px;color:#6B7280;">${tierLabel}</span>` : ''}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-size:13px;color:#6B7280;">學校</td>
          <td style="padding:8px 0;font-size:14px;color:#374151;">${p.schoolName ?? '未填寫'}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-size:13px;color:#6B7280;">電話</td>
          <td style="padding:8px 0;font-size:14px;color:#374151;">${p.parentPhone ?? '未填寫'}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-size:13px;color:#6B7280;">電郵</td>
          <td style="padding:8px 0;font-size:14px;color:#374151;">${p.parentEmail ?? '未填寫'}</td>
        </tr>
      </table>
    </div>

    <!-- Score -->
    <div style="margin:20px 32px;padding:16px 20px;background:#F9FAFB;border-radius:12px;display:flex;align-items:center;gap:20px;">
      <div style="text-align:center;min-width:64px;">
        <div style="font-size:36px;font-weight:800;color:${scoreColor};">${p.score}</div>
        <div style="font-size:11px;color:#9CA3AF;margin-top:2px;">總分 / 100</div>
      </div>
      <div style="width:1px;height:48px;background:#E5E7EB;"></div>
      <div>
        <div style="font-size:14px;color:#374151;">答對 <strong>${p.totalCorrect}</strong> / ${p.totalQuestions} 題</div>
        <div style="font-size:12px;color:#9CA3AF;margin-top:4px;">正確率 ${p.totalQuestions > 0 ? Math.round(p.totalCorrect / p.totalQuestions * 100) : 0}%</div>
      </div>
    </div>

    <!-- Weak areas -->
    ${weakAreas.length > 0 ? `
    <div style="padding:0 32px 8px;">
      <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:#6B7280;text-transform:uppercase;letter-spacing:1px;">需加強範疇</p>
      <table style="width:100%;border-collapse:collapse;">
        ${weakRows}
      </table>
    </div>` : ''}

    <!-- CTA -->
    <div style="padding:24px 32px 28px;">
      <a href="${reportUrl}"
        style="display:block;text-align:center;padding:14px 24px;background:linear-gradient(135deg,#1D9E75 0%,#0E7CBF 100%);color:#fff;font-size:15px;font-weight:600;text-decoration:none;border-radius:12px;">
        查看完整評估報告
      </a>
      <p style="margin:12px 0 0;text-align:center;font-size:12px;color:#9CA3AF;">
        或複製連結：${reportUrl}
      </p>
    </div>

    <!-- Footer -->
    <div style="padding:16px 32px;background:#F9FAFB;border-top:1px solid #F3F4F6;">
      <p style="margin:0;font-size:12px;color:#9CA3AF;text-align:center;">
        霖楓學苑 LF Academy · 此為自動通知，無需回覆
      </p>
    </div>
  </div>
</body>
</html>`
}

export async function sendAssessmentNotification(payload: AssessmentNotificationPayload): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  const toEmail = process.env.TEACHER_NOTIFICATION_EMAIL
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://mathtutor.vercel.app'

  if (!apiKey || !toEmail) {
    console.warn('[email] RESEND_API_KEY or TEACHER_NOTIFICATION_EMAIL not set — skipping notification')
    return
  }

  const reportUrl = `${appUrl}/assessment/report/${payload.sessionId}`
  const html = buildEmailHtml(payload, reportUrl)

  const scoreColor = payload.score >= 80 ? '🟢' : payload.score >= 60 ? '🟡' : '🔴'
  const subject = `${scoreColor} 新評估：${payload.studentName}（${payload.gradeLevel}）— ${payload.score}分`

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'LF Academy <noreply@resend.dev>',
        to: [toEmail],
        subject,
        html,
      }),
    })

    if (!res.ok) {
      const body = await res.text()
      console.error('[email] Resend API error:', res.status, body)
    }
  } catch (err) {
    // Email failure should never block the assessment response
    console.error('[email] Failed to send notification:', err)
  }
}
