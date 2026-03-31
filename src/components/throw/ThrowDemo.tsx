'use client'

import { useState } from 'react'
import { Board } from '@/components/board/Board'
import { YutThrowOverlay } from '@/components/throw/YutThrowOverlay'
import { generateThrow } from '@/lib/yut/throw'
import type { ThrowResult } from '@/lib/yut/types'

export function ThrowDemo(): React.JSX.Element {
  const [activeResult, setActiveResult] = useState<ThrowResult | null>(null)

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fffaf0_0%,#fde8c8_50%,#f8d9a8_100%)] px-4 py-8">
      <section className="mx-auto flex max-w-3xl flex-col items-center gap-6 rounded-[32px] bg-white/72 px-5 py-6 text-[#1A1A2E] shadow-[0_30px_90px_rgba(120,75,24,0.16)] backdrop-blur-md">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#A06A2A]">
            Phase 4 Demo
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">윷 던지기 미리보기</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[#5C442A]">
            기존 보드는 그대로 두고, 결과가 정해진 3D 윷 던지기 연출만 잠깐 올려서 확인하는
            단계입니다.
          </p>
        </div>

        <div className="relative w-full max-w-[500px] rounded-[28px] bg-[linear-gradient(180deg,#fff9ee_0%,#f9edd1_45%,#efd2a4_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_18px_45px_rgba(106,70,34,0.16)]">
          <div className="pointer-events-none absolute inset-0 rounded-[28px] bg-[radial-gradient(circle_at_top,#fff7e4_0%,transparent_62%)]" />
          <div className="relative w-full max-w-[500px]">
            <Board />
            <YutThrowOverlay
              open={activeResult !== null}
              result={activeResult}
              onComplete={() => setActiveResult(null)}
            />
          </div>
        </div>

        <button
          type="button"
          className="min-h-11 rounded-full bg-[#1A1A2E] px-6 text-white disabled:opacity-50"
          disabled={activeResult !== null}
          onClick={() => {
            setActiveResult(generateThrow())
          }}
        >
          던지기
        </button>
      </section>
    </main>
  )
}
