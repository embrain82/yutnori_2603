'use client'

import dynamic from 'next/dynamic'

const Game = dynamic(() => import('@/components/Game'), {
  ssr: false,
  loading: () => <main className="min-h-dvh bg-[#FFF8EE]" />,
})

export function GameEntry(): React.JSX.Element {
  return <Game />
}
