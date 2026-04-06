import type { AuthOptions } from 'next-auth'
import { SupabaseAdapter } from '@auth/supabase-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import { supabase } from './supabase'

export const authOptions: AuthOptions = {
  adapter: SupabaseAdapter({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  }),
  session: {
    strategy: 'jwt',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const { data, error } = await supabase.auth.signInWithPassword({
          email: credentials.email as string,
          password: credentials.password as string,
        })

        if (error) return null

        return {
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.name,
          role: data.user.user_metadata?.role,
        }
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        ;(token as Record<string, unknown>).id = user.id
        ;(token as Record<string, unknown>).role = (user as { role?: string }).role
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        type SessionUser = {
          name?: string | null
          email?: string | null
          image?: string | null
          id?: string
          role?: string
        }

        const updatedUser = {
          ...(session.user as SessionUser),
          id: (token as Record<string, unknown>).id as string,
          role: (token as Record<string, unknown>).role as string,
        }

        session.user = updatedUser as unknown as typeof session.user
      }
      return session
    },
  },
}
