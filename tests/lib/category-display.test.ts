import { describe, expect, it } from 'vitest'
import { getCategoryDisplayName } from '@/lib/category-display'
import type { Category } from '@/lib/types'

describe('category display naming', () => {
  it('renames the Platform genre to Platformer', () => {
    const category: Category = {
      type: 'genre',
      id: 8,
      name: 'Platform',
      slug: 'platform',
    }

    expect(getCategoryDisplayName(category)).toBe('Platformer')
  })
})
