import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as { role?: string })?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let id: string
  let months: number

  try {
    const body = await request.json()
    id = body.id
    months = body.months

    // Validate id - must be non-empty string
    if (!id || typeof id !== 'string' || id.trim() === '') {
      return NextResponse.json(
        { error: 'Invalid student id: must be a non-empty string' },
        { status: 400 }
      )
    }

    // Validate months - must be positive integer between 1 and 120
    if (
      !Number.isInteger(months) ||
      months < 1 ||
      months > 120 ||
      Number.isNaN(months)
    ) {
      return NextResponse.json(
        {
          error:
            'Invalid months: must be an integer between 1 and 120',
        },
        { status: 400 }
      )
    }
  } catch (err) {
    console.error('Request parsing error:', err)
    return NextResponse.json(
      { error: 'Invalid request body: must be valid JSON' },
      { status: 400 }
    )
  }

  const expirationDate = new Date()
  expirationDate.setMonth(expirationDate.getMonth() + months)

  const { error } = await supabase
    .from('profiles')
    .update({
      status: 'active',
      expiration_date: expirationDate.toISOString(),
    })
    .eq('id', id)

  if (error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )

  return NextResponse.json({ success: true })
}