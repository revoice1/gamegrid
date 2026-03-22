'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ROUTE_ACHIEVEMENT_ID, ROUTE_PENDING_TOAST_KEY, ROUTE_SLUG } from '@/lib/route-index'

export function IndexEchoPage() {
  const router = useRouter()

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.sessionStorage.setItem(ROUTE_PENDING_TOAST_KEY, ROUTE_ACHIEVEMENT_ID)

    const redirectTimer = window.setTimeout(() => {
      router.replace('/')
    }, 2200)

    return () => window.clearTimeout(redirectTimer)
  }, [router])

  return (
    <main className="fixed inset-0 z-[120] overflow-hidden bg-black text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,197,94,0.16),transparent_28%),radial-gradient(circle_at_center,rgba(59,130,246,0.08),transparent_56%),#020409]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,rgba(255,255,255,0.05)_49%,transparent_51%,transparent_100%)] opacity-30" />
      <div className="relative flex min-h-screen items-center justify-center px-6">
        <div className="text-center">
          <p className="glitch-subtitle text-xs font-semibold uppercase tracking-[0.42em] text-emerald-300/80">
            Hidden Route
          </p>
          <h1
            className="glitch-title mt-4 select-none text-5xl font-black uppercase italic tracking-[0.2em] text-white sm:text-7xl"
            data-text={ROUTE_SLUG}
          >
            {ROUTE_SLUG}
          </h1>
          <p className="glitch-copy mt-5 text-sm text-white/70 sm:text-base">...you found me</p>
        </div>
      </div>
      <style jsx>{`
        .glitch-title {
          position: relative;
          text-shadow:
            0 0 20px rgba(34, 197, 94, 0.18),
            0 0 42px rgba(59, 130, 246, 0.12);
          animation: glitch-jitter 180ms steps(2, end) infinite;
        }

        .glitch-title::before,
        .glitch-title::after {
          content: attr(data-text);
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .glitch-title::before {
          color: rgba(34, 197, 94, 0.95);
          transform: translate(-2px, 0);
          clip-path: inset(0 0 48% 0);
          animation: glitch-slice-a 900ms steps(2, end) infinite;
        }

        .glitch-title::after {
          color: rgba(96, 165, 250, 0.92);
          transform: translate(2px, 0);
          clip-path: inset(52% 0 0 0);
          animation: glitch-slice-b 1100ms steps(2, end) infinite;
        }

        .glitch-copy {
          animation: glitch-fade 800ms ease-out both;
        }

        .glitch-subtitle {
          animation: glitch-fade 600ms ease-out both;
        }

        @keyframes glitch-fade {
          0% {
            opacity: 0;
            transform: translateY(8px);
            filter: blur(8px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
            filter: blur(0);
          }
        }

        @keyframes glitch-jitter {
          0%,
          100% {
            transform: translate(0, 0);
          }
          25% {
            transform: translate(1px, -1px);
          }
          50% {
            transform: translate(-1px, 1px);
          }
          75% {
            transform: translate(1px, 1px);
          }
        }

        @keyframes glitch-slice-a {
          0%,
          100% {
            transform: translate(-2px, 0);
          }
          20% {
            transform: translate(-4px, -1px);
          }
          40% {
            transform: translate(1px, 1px);
          }
          60% {
            transform: translate(-3px, 1px);
          }
          80% {
            transform: translate(2px, -1px);
          }
        }

        @keyframes glitch-slice-b {
          0%,
          100% {
            transform: translate(2px, 0);
          }
          20% {
            transform: translate(4px, 1px);
          }
          40% {
            transform: translate(-1px, -1px);
          }
          60% {
            transform: translate(3px, -1px);
          }
          80% {
            transform: translate(-2px, 1px);
          }
        }
      `}</style>
    </main>
  )
}
