'use client'

import type { AiReaction } from '@/store/gameStore'

export const AI_REACTION_EMOJIS = {
  neutral: '🙂',
  excited: '😄',
  worried: '😟',
  smug: '😏',
} as const

interface AiReactionBubbleProps {
  reaction: AiReaction
  thinking: boolean
}

export function AiReactionBubble({
  reaction,
  thinking,
}: AiReactionBubbleProps): React.JSX.Element {
  return (
    <div className="flex items-center gap-2 rounded-full bg-white/88 px-3 py-2 text-[#1A1A2E] shadow-[0_8px_24px_rgba(120,75,24,0.12)]">
      <div className="rounded-full bg-[#FFF7E2] px-3 py-2 text-2xl shadow-[0_8px_24px_rgba(120,75,24,0.12)]">
        <span aria-label="ai-reaction">{AI_REACTION_EMOJIS[reaction]}</span>
      </div>
      <div className="flex flex-col leading-tight">
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#A06A2A]">
          AI 상태
        </span>
        <span className="text-sm font-medium">
          {thinking ? '생각 중...' : 'AI 반응'}
        </span>
      </div>
    </div>
  )
}
