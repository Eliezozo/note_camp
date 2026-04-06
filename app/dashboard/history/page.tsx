'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface SummaryItem {
  id: string
  title: string
  created_at: string
  preview: string
}

export default function HistoryPage() {
  const { status } = useSession()
  const router = useRouter()
  const [summaries, setSummaries] = useState<SummaryItem[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (status !== 'authenticated') {
      return
    }

    const controller = new AbortController()

    const fetchSummaries = async () => {
      try {
        const res = await fetch('/api/summaries', {
          signal: controller.signal,
        })

        if (!res.ok) {
          setError(
            `Failed to load summaries (${res.status})`
          )
          return
        }

        const data = await res.json()

        if (!Array.isArray(data)) {
          setError('Invalid response format')
          return
        }

        setSummaries(data)
      } catch (err) {
        if (
          err instanceof Error &&
          err.name === 'AbortError'
        ) {
          return
        }
        const errorMsg =
          err instanceof Error
            ? err.message
            : 'Unknown error'
        console.error('Fetch summaries error:', err)
        setError(
          `Error loading summaries: ${errorMsg}`
        )
      }
    }

    fetchSummaries()

    return () => {
      controller.abort()
    }
  }, [status])

  if (status === 'loading') return <div>Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">
          Historique des résumés
        </h1>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-800">
            {error}
          </div>
        )}

        {summaries.length === 0 && !error && (
          <p className="text-gray-600">
            Aucun résumé trouvé. Commencez par créer un
            résumé!
          </p>
        )}

        <div className="space-y-4">
          {summaries.map((summary) => (
            <Link
              key={summary.id}
              href={`/dashboard/resume/${summary.id}`}
              className="block bg-white p-6 rounded-lg shadow hover:shadow-md"
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-semibold">{summary.title}</h2>
                <span className="text-sm text-gray-500">{new Date(summary.created_at).toLocaleDateString()}</span>
              </div>
              <p className="text-sm text-gray-600">{summary.preview}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}