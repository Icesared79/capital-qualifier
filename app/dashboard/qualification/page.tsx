import { redirect } from 'next/navigation'

// Redirect to the new apply page
export default function QualificationPage() {
  redirect('/dashboard/apply')
}
