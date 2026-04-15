import { redirect } from 'next/navigation'

// Generic /login no longer exists — always send users to the role selector.
export default function LoginRedirect() {
  redirect('/')
}
