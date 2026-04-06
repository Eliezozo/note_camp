import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = (session.user as { id?: string })?.id
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('summaries')
    .select('id,title,content,created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  type SummaryRow = {
    id: string
    title: string
    content: string
    created_at: string
  }

  const summaries = (data as SummaryRow[]).map((item) => ({
    id: item.id,
    title: item.title,
    created_at: item.created_at,
    preview:
      item.content.length > 160
        ? item.content.slice(0, 160) + '...'
        : item.content,
  }))

  return NextResponse.json(summaries)
}