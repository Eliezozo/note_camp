'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

interface Student {
  id: string
  email: string
  name: string
  status: 'active' | 'expired' | 'pending'
  expiration_date: string
  summary_count: number
}

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [students, setStudents] = useState<Student[]>([])
  const [error, setError] = useState('')
  const [activatingId, setActivatingId] = useState<string | null>(
    null
  )

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (session) {
      const role = (session.user as { role?: string })
        ?.role
      if (role !== 'admin') {
        router.push('/dashboard')
      }
    }
  }, [status, session, router])

  useEffect(() => {
    if (status !== 'authenticated') {
      return
    }

    const role = (session?.user as { role?: string })
      ?.role
    if (role !== 'admin') {
      return
    }

    const controller = new AbortController()

    const fetchStudents = async () => {
      try {
        const res = await fetch(
          '/api/admin/students',
          { signal: controller.signal }
        )

        if (!res.ok) {
          setError(
            `Failed to load students (${res.status})`
          )
          return
        }

        const data = await res.json()

        if (!Array.isArray(data)) {
          setError('Invalid response format')
          return
        }

        setStudents(data)
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
        console.error('Fetch students error:', err)
        setError(
          `Error loading students: ${errorMsg}`
        )
      }
    }

    fetchStudents()

    return () => {
      controller.abort()
    }
  }, [status, session])

  const activateStudent = async (
    id: string,
    months: number
  ) => {
    setActivatingId(id)
    setError('')

    try {
      const res = await fetch(
        '/api/admin/activate',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id, months }),
        }
      )

      if (!res.ok) {
        let errorMsg =
          'Failed to activate student'
        try {
          const errorData = await res.json()
          errorMsg =
            errorData.error ||
            `Server error (${res.status})`
        } catch {
          errorMsg = `Server error (${res.status})`
        }
        setError(errorMsg)
        setActivatingId(null)
        return
      }

      // Refresh list after successful activation
      const listRes = await fetch(
        '/api/admin/students'
      )

      if (!listRes.ok) {
        setError(
          'Activation succeeded but failed to refresh list'
        )
        setActivatingId(null)
        return
      }

      const data = await listRes.json()

      if (!Array.isArray(data)) {
        setError(
          'Activation succeeded but got invalid data'
        )
        setActivatingId(null)
        return
      }

      setStudents(data)
      setActivatingId(null)
    } catch (err) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : 'Network error'
      console.error('Activate student error:', err)
      setError(`Error: ${errorMsg}`)
      setActivatingId(null)
    }
  }

  if (status === 'loading') return <div>Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">
          Administration
        </h1>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-800">
            {error}
          </div>
        )}

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-bold mb-4">
            Étudiants inscrits
          </h2>
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left">Nom</th>
                <th className="text-left">Email</th>
                <th className="text-left">Statut</th>
                <th className="text-left">
                  Expiration
                </th>
                <th className="text-left">
                  Résumés
                </th>
                <th className="text-left">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id}>
                  <td>{student.name}</td>
                  <td>{student.email}</td>
                  <td>{student.status}</td>
                  <td>{student.expiration_date}</td>
                  <td>{student.summary_count}</td>
                  <td>
                    <Button
                      onClick={() =>
                        activateStudent(
                          student.id,
                          1
                        )
                      }
                      disabled={
                        activatingId ===
                        student.id
                      }
                    >
                      1 mois
                    </Button>
                    <Button
                      onClick={() =>
                        activateStudent(
                          student.id,
                          3
                        )
                      }
                      disabled={
                        activatingId ===
                        student.id
                      }
                    >
                      3 mois
                    </Button>
                    <Button
                      onClick={() =>
                        activateStudent(
                          student.id,
                          6
                        )
                      }
                      disabled={
                        activatingId ===
                        student.id
                      }
                    >
                      6 mois
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}