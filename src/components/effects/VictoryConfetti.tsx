'use client'

import { useEffect, useRef } from 'react'
import confetti from 'canvas-confetti'
import { useGameStore } from '@/store/gameStore'

export function VictoryConfetti(): null {
  const phase = useGameStore((state) => state.phase)
  const hasFiredRef = useRef(false)
  const timerIdsRef = useRef<number[]>([])

  useEffect(() => {
    if (phase === 'victory' && !hasFiredRef.current) {
      hasFiredRef.current = true

      const defaults = {
        particleCount: 56,
        spread: 78,
        startVelocity: 42,
        gravity: 1.1,
        ticks: 240,
        disableForReducedMotion: true,
        useWorker: true,
      }

      // Replay safety matters because the result screen can re-enter victory after a restart in one session.
      confetti({
        ...defaults,
        origin: { x: 0.5, y: 0.68 },
      })

      timerIdsRef.current.push(
        window.setTimeout(() => {
          confetti({
            ...defaults,
            particleCount: 44,
            angle: 62,
            origin: { x: 0.16, y: 0.74 },
          })
        }, 320),
      )

      timerIdsRef.current.push(
        window.setTimeout(() => {
          confetti({
            ...defaults,
            particleCount: 44,
            angle: 118,
            origin: { x: 0.84, y: 0.74 },
          })
        }, 680),
      )

      timerIdsRef.current.push(
        window.setTimeout(() => {
          confetti({
            ...defaults,
            particleCount: 84,
            spread: 92,
            origin: { x: 0.5, y: 0.56 },
          })
        }, 1120),
      )
    }

    if (phase !== 'victory') {
      hasFiredRef.current = false
    }

    return () => {
      confetti.reset()
      timerIdsRef.current.forEach((timerId) => window.clearTimeout(timerId))
      timerIdsRef.current = []
    }
  }, [phase])

  return null
}
