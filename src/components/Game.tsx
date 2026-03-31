'use client'

import { useEffect, useEffectEvent, useRef } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { VictoryConfetti } from '@/components/effects/VictoryConfetti'
import { DefeatEffect } from '@/components/effects/DefeatEffect'
import { IdleScreen } from '@/components/screens/IdleScreen'
import { PlayScreen } from '@/components/screens/PlayScreen'
import { ResultScreen } from '@/components/screens/ResultScreen'
import { usePostMessage } from '@/hooks/usePostMessage'
import { useGameStore } from '@/store/gameStore'

const PLAY_PHASES = new Set([
  'readyToThrow',
  'throwing',
  'selectingPiece',
  'animatingMove',
  'confirmingStack',
  'aiThinking',
])

export default function Game(): React.JSX.Element {
  const phase = useGameStore((state) => state.phase)
  const runAiTurn = useGameStore((state) => state.runAiTurn)
  const timerRef = useRef<number | null>(null)
  const triggerAiTurn = useEffectEvent(() => {
    runAiTurn()
  })

  usePostMessage()

  useEffect(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }

    // The thinking delay lives in the UI so the store can stay synchronous and deterministic in tests.
    if (phase === 'aiThinking') {
      timerRef.current = window.setTimeout(() => {
        timerRef.current = null
        triggerAiTurn()
      }, 900)
    }

    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [phase])

  return (
    <div className="relative min-h-dvh overflow-hidden [contain:content]">
      <AnimatePresence mode="wait">
        {phase === 'idle' ? (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <IdleScreen />
          </motion.div>
        ) : null}

        {/* Keep the play shell mounted across intra-turn phases so the board never remounts mid-turn. */}
        {PLAY_PHASES.has(phase) ? (
          <motion.div
            key="play"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <PlayScreen />
          </motion.div>
        ) : null}

        {/* Phase 6 effects decorate the verified Phase 5 result flow rather than altering its timing semantics. */}
        {phase === 'victory' ? (
          <motion.div
            key="victory-result"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <VictoryConfetti />
            <ResultScreen />
          </motion.div>
        ) : null}

        {phase === 'defeat' ? (
          <motion.div
            key="defeat-result"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <DefeatEffect>
              <ResultScreen />
            </DefeatEffect>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
