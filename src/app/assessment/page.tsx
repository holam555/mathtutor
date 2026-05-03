import AssessmentFlow from './AssessmentFlow'

export const metadata = {
  // Title template at the root layout adds " | 霖楓學院數學升分平台" automatically.
  title: '學前數學評估',
  description: '免費學前數學評估，了解學生的數學強弱項，即時獲取個人化診斷報告。',
}

export default function AssessmentPage() {
  return <AssessmentFlow />
}
