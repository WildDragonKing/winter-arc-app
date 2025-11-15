'use client'

import { SessionProvider, useSession } from 'next-auth/react'
import { createContext, useContext, useEffect, useMemo } from 'react'
import type { ReactNode } from 'react'
import type { Session } from 'next-auth'
import type { User } from '@/app/types'
import { useStore } from '@/app/store/useStore'
import { clearDemoModeMarker, isDemoModeActive } from '@/app/constants/demo'
import { addBreadcrumb } from '@/app/services/sentryService'

const DEFAULT_ACTIVITIES = ['pushups', 'sports', 'water', 'protein'] as const
const DEFAULT_PUSHUP_STATE = { baseReps: 0, sets: 5, restTime: 90 } as const

interface AuthProviderProps {
  children: ReactNode
}

interface AuthContextValue {
  session: Session | null
  status: 'authenticated' | 'unauthenticated' | 'loading'
  user: User | null
  isOnboarded: boolean
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function AuthProviderContent({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession()
  const setUser = useStore((state) => state.setUser)
  const setIsOnboarded = useStore((state) => state.setIsOnboarded)
  const setAuthLoading = useStore((state) => state.setAuthLoading)
  const setTracking = useStore((state) => state.setTracking)

  const storeUser = useStore((state) => state.user)
  const storeIsOnboarded = useStore((state) => state.isOnboarded)

  // Fetch user data when session is available
  useEffect(() => {
    // Keep loading state while NextAuth is initializing
    if (status === 'loading') {
      setAuthLoading(true)
      return
    }

    if (status === 'authenticated' && session?.user?.id) {
      // Keep loading while we fetch user data
      setAuthLoading(true)

      // Fetch full user data from API
      fetch(`/api/users/${session.user.id}`)
        .then((res) => {
          if (!res.ok) throw new Error('Failed to fetch user data')
          return res.json()
        })
        .then((userData: User) => {
          addBreadcrumb('Auth: fetched user from API', { id: userData.id })
          clearDemoModeMarker()

          // Ensure user has default values
          const normalizedUser: User = {
            ...userData,
            birthday: userData.birthday ?? undefined,
            createdAt: userData.createdAt ? new Date(userData.createdAt) : new Date(),
            enabledActivities: userData.enabledActivities?.length
              ? userData.enabledActivities
              : [...DEFAULT_ACTIVITIES],
            pushupState: userData.pushupState ?? { ...DEFAULT_PUSHUP_STATE },
          }

          setUser(normalizedUser)
          setIsOnboarded(Boolean(userData.birthday))

          // Only set loading to false after user data is fully loaded
          setAuthLoading(false)
        })
        .catch((error) => {
          console.error('Failed to fetch user data:', error)
          setUser(null)
          setIsOnboarded(false)
          setAuthLoading(false)
        })
      return
    }

    // Unauthenticated state - only set after we're certain
    if (status === 'unauthenticated') {
      if (isDemoModeActive()) {
        setAuthLoading(false)
        return
      }

      setUser(null)
      setIsOnboarded(false)
      setTracking({})
      setAuthLoading(false)

      // Clean up storage for unauthenticated users
      try {
        const keysToRemove: string[] = []
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (!key) continue
          if (
            key.startsWith('winterarc_') ||
            key.startsWith('wa_') ||
            key.startsWith('tracking_') ||
            key.startsWith('nextauth.') ||
            key.includes('session')
          ) {
            keysToRemove.push(key)
          }
        }
        keysToRemove.forEach((key) => localStorage.removeItem(key))

        const sessionKeysToRemove: string[] = []
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i)
          if (!key) continue
          if (key.startsWith('winterarc_') || key.startsWith('wa_') || key.includes('session')) {
            sessionKeysToRemove.push(key)
          }
        }
        sessionKeysToRemove.forEach((key) => sessionStorage.removeItem(key))
      } catch (error) {
        console.warn('Selective session cleanup failed', error)
      }
    }
  }, [session, status, setAuthLoading, setIsOnboarded, setTracking, setUser])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      status,
      user: storeUser,
      isOnboarded: storeIsOnboarded,
    }),
    [session, status, storeUser, storeIsOnboarded],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function AuthProvider({ children }: AuthProviderProps) {
  return (
    <SessionProvider>
      <AuthProviderContent>{children}</AuthProviderContent>
    </SessionProvider>
  )
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}
