'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import DOMPurify from 'isomorphic-dompurify'

interface SummaryDetails {
  id: string
  title: string
  content: string
  created_at: string
}

export default function SummaryPage({
  params,
}: {
  params: { id: string }
}) {
  const { status } = useSession()
  const router = useRouter()
  const [summary, setSummary] = useState<SummaryDetails | null>(
    null
  )
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (status !== 'authenticated' || !params.id) {
      return
    }

    const controller = new AbortController()

    const fetchSummary = async () => {
      try {
        const res = await fetch(
          `/api/summaries/${params.id}`,
          { signal: controller.signal }
        )

        if (res.status === 404) {
          setError('Summary not found')
          setSummary(null)
          return
        }

        if (!res.ok) {
          setError(
            `Failed to load summary (${res.status})`
          )
          setSummary(null)
          return
        }

        const data = await res.json()

        if (
          !data ||
          !data.id ||
          typeof data.content !== 'string'
        ) {
          setError('Invalid summary data')
          setSummary(null)
          return
        }

        setSummary(data)
        setError('')
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
        console.error('Fetch summary error:', err)
        setError(`Error loading summary: ${errorMsg}`)
        setSummary(null)
      } finally {
        setIsLoading(false)
      }
    }

    setIsLoading(true)
    fetchSummary()

    return () => {
      controller.abort()
    }
  }, [status, params.id])

  if (status === 'loading' || isLoading)
    return <div>Loading...</div>

  if (error)
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    )

  if (!summary)
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow">
          <p>Résumé non trouvé.</p>
        </div>
      </div>
    )

  const sanitizedContent = DOMPurify.sanitize(
    summary.content
  )

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow">
        <h1 className="text-3xl font-bold mb-4">
          {summary.title}
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          {new Date(
            summary.created_at
          ).toLocaleDateString()}
        </p>
        <div
          className="prose prose-lg"
          dangerouslySetInnerHTML={{
            __html: sanitizedContent,
          }}
        />
      </div>
    </div>
  )
}