'use client'

import { useGameStore } from '@/store/gameStore'

export function IdleScreen(): React.JSX.Element {
  const startGame = useGameStore((state) => state.startGame)

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[linear-gradient(180deg,#fffaf0_0%,#fde8c8_50%,#f8d9a8_100%)] px-4 py-8">
      <section className="mx-auto flex w-full max-w-xl flex-col items-center gap-5 rounded-[32px] bg-white/78 px-6 py-8 text-center text-[#1A1A2E] shadow-[0_30px_90px_rgba(120,75,24,0.16)] backdrop-blur-md">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#A06A2A]">
          Yut Nori
        </p>
        <h1 className="text-4xl font-semibold tracking-tight">윷놀이 한 판</h1>
        <p className="max-w-md text-sm leading-6 text-[#5C442A]">
          3D 윷 던지기와 2D 말판으로 AI와 대결해보세요.
        </p>
        <button
          type="button"
          onClick={startGame}
          className="min-h-11 rounded-full bg-[#1A1A2E] px-6 text-white shadow-[0_16px_36px_rgba(26,26,46,0.22)]"
        >
          게임 시작
        </button>
      </section>
    </main>
  )
}
