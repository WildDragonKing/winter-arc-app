export { auth as middleware } from '@/lib/auth'

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/settings/:path*',
    '/leaderboard/:path*',
    '/onboarding/:path*',
    '/input/:path*',
    '/tracking/:path*',
  ],
}
