'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function AuthErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const errorMessages: Record<string, string> = {
    Configuration: 'Es gibt ein Problem mit der Server-Konfiguration.',
    AccessDenied: 'Du hast keinen Zugriff. Bitte kontaktiere den Administrator.',
    Verification: 'Der Verifizierungslink ist abgelaufen oder wurde bereits verwendet.',
    Default: 'Ein unbekannter Fehler ist aufgetreten.'
  }

  const errorMessage = errorMessages[error || 'Default'] || errorMessages.Default

  return (
    <div className="min-h-screen bg-gradient-to-br from-winter-900 to-winter-800 flex items-center justify-center p-4">
      <div className="bg-black/30 backdrop-blur-sm rounded-2xl border border-winter-700/30 p-8 w-full max-w-md text-center">
        <div className="mb-6">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-white mb-2">Anmeldung fehlgeschlagen</h1>
          <p className="text-winter-300">{errorMessage}</p>
        </div>

        <div className="space-y-4">
          <Link
            href="/auth/signin"
            className="block w-full bg-winter-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-winter-700 transition-colors"
          >
            Erneut versuchen
          </Link>

          <Link
            href="/"
            className="block w-full border border-winter-600 text-winter-300 font-semibold py-3 px-4 rounded-lg hover:bg-winter-600/20 transition-colors"
          >
            Zur Startseite
          </Link>
        </div>

        {error && (
          <div className="mt-6 p-3 bg-red-900/20 border border-red-700/30 rounded-lg">
            <p className="text-red-300 text-sm">Error Code: {error}</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Route segment config to force dynamic rendering
export const dynamic = 'force-dynamic'
export const dynamicParams = true

export default function AuthError() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-winter-900 to-winter-800 flex items-center justify-center"><div className="text-white">Loading...</div></div>}>
      <AuthErrorContent />
    </Suspense>
  )
}
