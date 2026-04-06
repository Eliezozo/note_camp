import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await context.params

  const userId = (session.user as { id?: string })?.id
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('summaries')
    .select('id,title,content,created_at')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle()

  if (error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )

  if (!data)
    return NextResponse.json(
      { error: 'Not found' },
      { status: 404 }
    )

  return NextResponse.json(data)
}