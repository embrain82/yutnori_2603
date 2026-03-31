'use client'

import type { ThrowResult } from '@/lib/yut/types'

export const RESULT_LABELS = { do: '도', gae: '개', geol: '걸', yut: '윷', mo: '모' } as const

export function ThrowResultCard({ result }: { result: ThrowResult }): React.JSX.Element {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="rounded-full bg-[#1A1A2E]/72 px-8 py-4 shadow-[0_14px_40px_rgba(26,26,46,0.22)]">
        <span className="text-[clamp(2.25rem,8vw,3.5rem)] font-bold tracking-tight text-[#FFD700] drop-shadow-[0_4px_12px_rgba(26,26,46,0.35)]">
          {RESULT_LABELS[result.name]}
        </span>
      </div>
    </div>
  )
}
