import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import PartnerPreferencesSettings from '@/components/partner/PartnerPreferencesSettings'
import { ArrowLeft } from 'lucide-react'

export default async function OptmaSettingsPage() {
  const supabase = createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Verify optma or admin role (admin can access for testing)
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'optma' && profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  // Get partner by slug
  const { data: partner, error: partnerError } = await supabase
    .from('funding_partners')
    .select('id, name, slug')
    .eq('slug', 'optima')
    .single()

  if (partnerError || !partner) {
    // Fallback to first active partner
    const { data: altPartner, error: altError } = await supabase
      .from('funding_partners')
      .select('id, name, slug')
      .eq('status', 'active')
      .limit(1)
      .single()

    if (altError || !altPartner) {
      redirect('/dashboard/optma')
    }

    return renderSettings(supabase, altPartner)
  }

  return renderSettings(supabase, partner)
}

async function renderSettings(
  supabase: any,
  partner: { id: string; name: string; slug: string }
) {
  // Fetch partner's preferences
  const { data: preferences } = await supabase
    .from('partner_notification_preferences')
    .select('*')
    .eq('partner_id', partner.id)
    .single()

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/optma"
          className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Deal Preferences & Settings
          </h1>
          <p className="text-base text-gray-600 dark:text-gray-400 mt-1">
            Configure your deal criteria and notification preferences
          </p>
        </div>
      </div>

      {/* Settings Form */}
      <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <PartnerPreferencesSettings
          preferences={preferences || null}
          isModal={false}
        />
      </div>
    </div>
  )
}
