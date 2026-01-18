import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  try {
    const body = await request.json()
    const email = body.email || 'optma@bitcense.com'
    const password = body.password || 'Optima123!'

    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(u => u.email === email)

    if (existingUser) {
      // User exists, just update the profile role
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: 'optma' })
        .eq('id', existingUser.id)

      if (updateError) {
        return NextResponse.json({
          success: false,
          error: 'User exists but could not update role: ' + updateError.message
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: 'User already exists. Role updated to optma.',
        email: email,
        note: 'Use your existing password to log in'
      })
    }

    // Create new user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true // Auto-confirm the email
    })

    if (authError) {
      return NextResponse.json({
        success: false,
        error: 'Could not create user: ' + authError.message
      }, { status: 500 })
    }

    // Create profile with optma role
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: authData.user.id,
        email: email,
        role: 'optma',
        full_name: 'Optima Partner'
      })

    if (profileError) {
      return NextResponse.json({
        success: false,
        error: 'User created but profile failed: ' + profileError.message,
        userId: authData.user.id
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Optima user created successfully!',
      email: email,
      password: password,
      note: 'You can now log in with these credentials'
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'POST to this endpoint with optional { email, password } to create an Optima user',
    defaults: {
      email: 'optma@bitcense.com',
      password: 'Optima123!'
    }
  })
}
