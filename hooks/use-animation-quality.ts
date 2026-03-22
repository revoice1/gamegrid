import { useEffect, useState } from 'react'

export type AnimationQuality = 'high' | 'medium' | 'low'

export function useAnimationQuality(detect: () => AnimationQuality) {
  const [quality, setQuality] = useState<AnimationQuality>('high')

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setQuality(detect())

    update()
    mediaQuery.addEventListener('change', update)
    return () => mediaQuery.removeEventListener('change', update)
  }, [detect])

  return quality
}
