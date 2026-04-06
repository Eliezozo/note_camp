'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export default function Dashboard() {
  const { status } = useSession()
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [summary, setSummary] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAudioFile(e.target.files[0])
    }
  }

  const startRecording = () => {
    // Implement recording logic
    setIsRecording(true)
  }

  const stopRecording = () => {
    // Implement stop recording
    setIsRecording(false)
  }

  const generateSummary = async () => {
    setError('')
    setSummary('')

    // Input validation
    if (!audioFile && !notes.trim()) {
      setError(
        'Please provide either an audio file or written notes'
      )
      return
    }

    if (notes.trim().length > 100000) {
      setError('Notes are too long (maximum 100,000 characters)')
      return
    }

    setLoading(true)

    try {
      const formData = new FormData()
      if (audioFile) {
        formData.append('audio', audioFile)
      } else {
        formData.append('notes', notes)
      }
      formData.append('title', title)

      const res = await fetch('/api/summarize', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        let errorMsg = 'Failed to generate summary'
        try {
          const errorData = await res.json()
          errorMsg =
            errorData.error ||
            `Server error (${res.status})`
        } catch {
          errorMsg = `Server error (${res.status})`
        }
        setError(errorMsg)
        return
      }

      const data = await res.json()

      if (!data.summary) {
        setError(
          'No summary was generated. Please try again.'
        )
        return
      }

      setSummary(data.summary)
    } catch (err) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : 'Network error occurred'
      console.error('Generate summary error:', err)
      setError(`Error: ${errorMsg}`)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading') return <div>Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Générer un résumé</h1>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="mb-4">
            <Label htmlFor="title">Titre du cours (optionnel)</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Mathématiques - Chapitre 5"
            />
          </div>

          <div className="mb-4">
            <Label>Notes vocales</Label>
            <div className="flex gap-4">
              <Button onClick={isRecording ? stopRecording : startRecording}>
                {isRecording ? 'Arrêter l\'enregistrement' : 'Enregistrer'}
              </Button>
              <Input type="file" accept="audio/*" onChange={handleAudioUpload} />
            </div>
          </div>

          <div className="mb-4">
            <Label htmlFor="notes">Ou notes écrites</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Collez vos notes de cours ici..."
              rows={10}
            />
          </div>

          <Button onClick={generateSummary} disabled={loading}>
            {loading ? 'Génération en cours...' : 'Générer le résumé'}
          </Button>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded text-red-800">
              {error}
            </div>
          )}
        </div>

        {summary && (
          <div className="bg-white p-6 rounded-lg shadow mt-8">
            <h2 className="text-2xl font-bold mb-4">Résumé</h2>
            <div className="whitespace-pre-wrap">{summary}</div>
          </div>
        )}
      </div>
    </div>
  )
}