'use client'

interface BurstOverlayProps {
  burstId: number
}

export function StealMissSplash({ burstId }: BurstOverlayProps) {
  return (
    <div
      key={burstId}
      data-testid="steal-miss-splash"
      className="pointer-events-none fixed inset-0 z-[90] grid place-items-center p-4"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.12),transparent_28%),rgba(0,0,0,0.18)]" />
      <div className="steal-miss-splash select-none px-6 text-center font-black uppercase italic tracking-[0.08em] text-[#ff6262] drop-shadow-[0_10px_28px_rgba(0,0,0,0.78)]">
        Wasted
      </div>
      <style jsx>{`
        .steal-miss-splash {
          font-size: clamp(2.8rem, 10vw, 6.5rem);
          line-height: 1;
          animation: steal-miss-hit 700ms var(--ease-bounce);
        }

        @keyframes steal-miss-hit {
          0% {
            transform: scale(1.16);
            letter-spacing: 0.14em;
            opacity: 0;
            filter: blur(10px);
          }
          52% {
            transform: scale(0.95);
            opacity: 1;
            filter: blur(0);
          }
          100% {
            transform: scale(1);
            letter-spacing: 0.08em;
            opacity: 1;
            filter: blur(0);
          }
        }
      `}</style>
    </div>
  )
}

export function DoubleKoSplash({ burstId }: BurstOverlayProps) {
  return (
    <div
      key={burstId}
      data-testid="double-ko-splash"
      className="pointer-events-none fixed inset-0 z-[90] grid place-items-center p-4"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.16),transparent_26%),radial-gradient(circle_at_center,rgba(239,68,68,0.14),transparent_44%),rgba(0,0,0,0.2)]" />
      <div className="double-ko-splash select-none px-6 text-center font-black uppercase italic tracking-[0.08em] text-[#ffcf5a] drop-shadow-[0_10px_28px_rgba(0,0,0,0.82)]">
        DOUBLE KO
      </div>
      <style jsx>{`
        .double-ko-splash {
          font-size: clamp(2.5rem, 8.8vw, 6rem);
          line-height: 0.9;
          text-shadow:
            0 0 18px rgba(245, 158, 11, 0.28),
            0 0 30px rgba(239, 68, 68, 0.18);
          animation: double-ko-hit 820ms var(--ease-bounce);
        }

        @keyframes double-ko-hit {
          0% {
            transform: scale(1.22) rotate(-2deg);
            letter-spacing: 0.16em;
            opacity: 0;
            filter: blur(12px);
          }
          48% {
            transform: scale(0.94) rotate(1deg);
            opacity: 1;
            filter: blur(0);
          }
          100% {
            transform: scale(1) rotate(0deg);
            letter-spacing: 0.08em;
            opacity: 1;
            filter: blur(0);
          }
        }
      `}</style>
    </div>
  )
}
