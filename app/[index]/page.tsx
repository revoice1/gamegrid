import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { IndexEchoPage } from '@/components/game/index-echo-page'
import { ROUTE_SLUG } from '@/lib/route-index'

export const metadata: Metadata = {
  title: 'Hidden Route',
  robots: {
    index: false,
    follow: false,
  },
}

export default async function IndexedRoutePage({ params }: { params: Promise<{ index: string }> }) {
  const { index } = await params

  if (index.toUpperCase() !== ROUTE_SLUG) {
    notFound()
  }

  return <IndexEchoPage />
}
