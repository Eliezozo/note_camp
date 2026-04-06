import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { supabase } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const title = formData.get('title') as string
  const notes = formData.get('notes') as string
  const audioFile = formData.get('audio') as File

  let text = notes

  if (audioFile) {
    // Transcribe audio with error handling
    try {
      const transcription = await openai.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
      })
      if (!transcription.text) {
        return NextResponse.json(
          {
            error:
              'Failed to transcribe audio: no text returned from Whisper',
          },
          { status: 422 }
        )
      }
      text = transcription.text
    } catch (err) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : 'Unknown error during transcription'
      console.error('Whisper transcription error:', errorMsg, { audioFile: audioFile?.name })
      return NextResponse.json(
        {
          error: `Audio transcription failed: ${errorMsg}`,
        },
        { status: 500 }
      )
    }
  }

  if (!text) {
    return NextResponse.json(
      { error: 'No content provided' },
      { status: 400 }
    )
  }

  // Generate summary with error handling
  let summary: string | null = null

  try {
    const prompt = `Génère un résumé structuré du cours suivant. Le résumé doit inclure :
- Un titre de cours (détecté ou fourni : ${title})
- Les points clés (liste à puces)
- Un résumé rédigé en 2-3 paragraphes
- Les notions importantes / mots-clés
- Des questions de révision

Contenu : ${text}

Réponds en français.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
    })

    // Validate completion response
    if (
      !completion ||
      !completion.choices ||
      completion.choices.length === 0
    ) {
      console.error('Invalid GPT response structure:', completion)
      return NextResponse.json(
        { error: 'Invalid response from summarization service' },
        { status: 500 }
      )
    }

    summary = completion.choices[0]?.message?.content

    if (!summary || typeof summary !== 'string' || summary.trim() === '') {
      console.error('Empty or invalid summary content from GPT')
      return NextResponse.json(
        { error: 'Failed to generate summary content' },
        { status: 500 }
      )
    }
  } catch (err) {
    const errorMsg =
      err instanceof Error
        ? err.message
        : 'Unknown error during summarization'
    console.error('GPT summarization error:', errorMsg)
    return NextResponse.json(
      {
        error: `Summary generation failed: ${errorMsg}`,
      },
      { status: 500 }
    )
  }

  // Save to database with error handling
  const userId = (session.user as { id?: string })?.id
  if (!userId) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const { data, error } = await supabase
      .from('summaries')
      .insert({
        user_id: userId,
        title: title || 'Cours sans titre',
        content: summary,
      })
      .select()

    if (error) {
      console.error('Database insert error:', error, {
        userId,
        title,
      })
      return NextResponse.json(
        { error: `Failed to save summary: ${error.message}` },
        { status: 500 }
      )
    }

    if (!data || data.length === 0) {
      console.error('No data returned from insert', { userId, title })
      return NextResponse.json(
        { error: 'Failed to save summary to database' },
        { status: 500 }
      )
    }
  } catch (err) {
    const errorMsg =
      err instanceof Error
        ? err.message
        : 'Unknown error during database insert'
    console.error('Database operation error:', errorMsg)
    return NextResponse.json(
      { error: `Database error: ${errorMsg}` },
      { status: 500 }
    )
  }

  return NextResponse.json({ summary })
}