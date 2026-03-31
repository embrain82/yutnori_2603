'use client'

import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { useGameStore } from '@/store/gameStore'

interface DefeatEffectProps {
  children: ReactNode
}

export function DefeatEffect({
  children,
}: DefeatEffectProps): React.JSX.Element {
  const phase = useGameStore((state) => state.phase)
  const isDefeat = phase === 'defeat'

  return (
    <motion.div
      data-testid="defeat-effect"
      data-state={isDefeat ? 'defeat' : 'idle'}
      initial={false}
      animate={
        isDefeat
          ? {
              scale: [1, 0.985, 1],
              y: [0, 3, 0],
              filter: ['saturate(1)', 'saturate(0.84)', 'saturate(1)'],
            }
          : { scale: 1, y: 0, filter: 'saturate(1)' }
      }
      transition={{ duration: 0.55, ease: 'easeOut' }}
      className="relative"
    >
      {isDefeat ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-10 top-6 h-24 rounded-full bg-[radial-gradient(circle,rgba(255,199,160,0.38)_0%,rgba(255,199,160,0)_72%)]"
        />
      ) : null}
      {children}
    </motion.div>
  )
}
