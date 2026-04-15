import { redirect } from 'next/navigation'

// Tokens are per-student. Parents view them inside each child's report.
// This route redirects to the parent home where children are listed.
export default function TokensRedirect() {
  redirect('/parent')
}
