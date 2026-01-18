import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function POST() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  // Read the migration file
  const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20250117_partner_portal_legal.sql')

  let migrationSQL: string
  try {
    migrationSQL = fs.readFileSync(migrationPath, 'utf8')
  } catch (error) {
    return NextResponse.json({ error: 'Could not read migration file' }, { status: 500 })
  }

  // Split into individual statements (simple split on semicolons followed by newlines)
  // This is a simplified approach - complex SQL might need better parsing
  const statements = migrationSQL
    .split(/;\s*\n/)
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))

  const results: { statement: string; success: boolean; error?: string }[] = []

  for (const statement of statements) {
    if (statement.length < 10) continue // Skip empty/tiny statements

    try {
      // Use the REST API to execute SQL
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sql: statement + ';' })
      })

      if (!response.ok) {
        // RPC might not exist, try alternative approach
        results.push({
          statement: statement.substring(0, 50) + '...',
          success: false,
          error: 'RPC not available'
        })
      } else {
        results.push({
          statement: statement.substring(0, 50) + '...',
          success: true
        })
      }
    } catch (error: any) {
      results.push({
        statement: statement.substring(0, 50) + '...',
        success: false,
        error: error.message
      })
    }
  }

  return NextResponse.json({
    message: 'Migration attempted. Due to Supabase limitations, please run the SQL directly in the Supabase SQL Editor for best results.',
    migrationFile: '20250117_partner_portal_legal.sql',
    statementCount: statements.length,
    note: 'Copy the SQL from supabase/migrations/20250117_partner_portal_legal.sql and run it in Supabase SQL Editor'
  })
}

export async function GET() {
  return NextResponse.json({
    message: 'POST to this endpoint to attempt migration, or copy SQL from supabase/migrations/20250117_partner_portal_legal.sql to Supabase SQL Editor'
  })
}
