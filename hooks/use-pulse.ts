import { useEffect, useState } from 'react'

export function usePulse(active: boolean, intervalMs: number): boolean {
  const [on, setOn] = useState(false)

  useEffect(() => {
    if (!active) {
      setOn(false)
      return
    }

    setOn(true)
    const id = window.setInterval(() => setOn((value) => !value), intervalMs)
    return () => window.clearInterval(id)
  }, [active, intervalMs])

  return on
}
