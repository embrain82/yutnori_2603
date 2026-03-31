'use client'

import type { Team } from '@/lib/yut/types'

interface TurnBannerProps {
  activeTeam: Team
  throwsRemaining: number
}

export function TurnBanner({
  activeTeam,
  throwsRemaining,
}: TurnBannerProps): React.JSX.Element {
  const label = activeTeam === 'player' ? '내 차례' : 'AI 차례'

  return (
    <div className="flex items-center justify-between rounded-full bg-white/80 px-4 py-2 text-[#1A1A2E] shadow-[0_10px_30px_rgba(120,75,24,0.12)]">
      <span className="text-sm font-semibold">{label}</span>
      <span className="text-xs font-medium text-[#7A5A32]">
        남은 던지기 {throwsRemaining}
      </span>
    </div>
  )
}
