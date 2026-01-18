import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// This endpoint helps debug and fix admin account issues
// Access it at: /api/debug/admin-setup?email=admin@bitcense.com

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email') || 'admin@bitcense.com'

  // Use service role to bypass RLS
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const results: any = {
    email,
    steps: [],
    success: false
  }

  try {
    // Step 1: Check auth.users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()

    if (authError) {
      results.steps.push({ step: 'Check auth.users', error: authError.message })
      return NextResponse.json(results)
    }

    const authUser = authUsers.users.find(u => u.email === email)

    if (!authUser) {
      results.steps.push({
        step: 'Check auth.users',
        error: `No user found with email ${email}`,
        availableUsers: authUsers.users.map(u => u.email)
      })
      return NextResponse.json(results)
    }

    results.steps.push({
      step: 'Check auth.users',
      success: true,
      userId: authUser.id,
      email: authUser.email,
      confirmed: authUser.email_confirmed_at ? true : false
    })

    // Step 2: Check profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single()

    if (profileError || !profile) {
      results.steps.push({
        step: 'Check profiles',
        error: 'Profile not found, creating one...'
      })

      // Create the profile
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: authUser.id,
          email: authUser.email,
          role: 'admin'
        })
        .select()
        .single()

      if (createError) {
        results.steps.push({
          step: 'Create profile',
          error: createError.message
        })
        return NextResponse.json(results)
      }

      results.steps.push({
        step: 'Create profile',
        success: true,
        profile: newProfile
      })
    } else {
      results.steps.push({
        step: 'Check profiles',
        success: true,
        profile
      })

      // Step 3: Update role to admin if needed
      if (profile.role !== 'admin') {
        const { data: updatedProfile, error: updateError } = await supabase
          .from('profiles')
          .update({ role: 'admin' })
          .eq('id', authUser.id)
          .select()
          .single()

        if (updateError) {
          results.steps.push({
            step: 'Update role to admin',
            error: updateError.message
          })
          return NextResponse.json(results)
        }

        results.steps.push({
          step: 'Update role to admin',
          success: true,
          oldRole: profile.role,
          newRole: 'admin',
          profile: updatedProfile
        })
      } else {
        results.steps.push({
          step: 'Check role',
          success: true,
          message: 'Role is already admin'
        })
      }
    }

    // Step 4: Confirm email if not confirmed
    if (!authUser.email_confirmed_at) {
      const { error: confirmError } = await supabase.auth.admin.updateUserById(
        authUser.id,
        { email_confirm: true }
      )

      if (confirmError) {
        results.steps.push({
          step: 'Confirm email',
          error: confirmError.message
        })
      } else {
        results.steps.push({
          step: 'Confirm email',
          success: true
        })
      }
    }

    results.success = true
    results.message = `Admin account ${email} is ready. Go to /admin to login.`

  } catch (err: any) {
    results.steps.push({ step: 'Unexpected error', error: err.message })
  }

  return NextResponse.json(results, { status: results.success ? 200 : 500 })
}
