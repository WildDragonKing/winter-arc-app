import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-winter-900 to-winter-800 flex items-center justify-center p-4">
      <div className="bg-black/30 backdrop-blur-sm rounded-2xl border border-winter-700/30 p-8 w-full max-w-md text-center">
        <div className="mb-6">
          <div className="text-winter-400 text-6xl mb-4">404</div>
          <h1 className="text-2xl font-bold text-white mb-2">Seite nicht gefunden</h1>
          <p className="text-winter-300">
            Die angeforderte Seite existiert nicht.
          </p>
        </div>

        <div className="space-y-4">
          <Link
            href="/"
            className="block w-full bg-winter-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-winter-700 transition-colors"
          >
            Zur Startseite
          </Link>
        </div>
      </div>
    </div>
  )
}
