'use client'

/**
 * Imperative hop animation hook for Yut Nori piece movement.
 *
 * Uses motion/react's useAnimate to sequentially animate a piece
 * through intermediate stations at 200ms per hop, landing at the
 * final station with a spring bounce. Also provides capture animation
 * (piece flies to HOME zone) and board shake effect.
 *
 * The hook manages an isAnimating flag that the Board component reads
 * to disable interaction during animation.
 */

import { useCallback, useState } from 'react'
import { useAnimate } from 'motion/react'
import { STATION_COORDS } from '@/lib/yut/boardCoords'

/** Duration of each intermediate hop in seconds */
const HOP_DURATION = 0.2

/** Ease-out cubic bezier for intermediate hops */
const HOP_EASE: [number, number, number, number] = [0.25, 0.1, 0.25, 1]

/** Spring config for the final landing hop */
const LANDING_SPRING = { type: 'spring' as const, stiffness: 400, damping: 20 }

/** Spring config for capture animation to HOME zone */
const CAPTURE_SPRING = { type: 'spring' as const, stiffness: 300, damping: 25 }

/** TranslateX keyframes for screen shake effect (in px) */
const SHAKE_KEYFRAMES = [0, -4, 4, -2, 2, 0]

/** Duration of screen shake in ms */
const SHAKE_DURATION = 300

/**
 * Return type for the useHopAnimation hook.
 *
 * @param scope - Ref to attach to the animating SVG group element
 * @param isAnimating - Whether an animation is currently in progress
 * @param startHop - Animate piece through intermediate stations to final station
 * @param animateCapture - Animate captured piece to HOME zone coordinates
 */
export interface HopAnimationResult {
  scope: React.RefObject<SVGGElement | null>
  isAnimating: boolean
  startHop: (intermediateStations: number[], finalStation: number) => Promise<void>
  animateCapture: (targetX: number, targetY: number) => Promise<void>
}

/**
 * Hook for imperative sequential hop animation using motion/react's useAnimate.
 *
 * Manages animation state and provides functions to animate piece movement
 * (hop-by-hop along intermediate stations) and capture (fly to HOME zone).
 *
 * @returns Object with scope ref, isAnimating flag, startHop, and animateCapture functions
 */
export function useHopAnimation(): HopAnimationResult {
  const [scope, animate] = useAnimate<SVGGElement>()
  const [isAnimating, setIsAnimating] = useState(false)

  /**
   * Animate a piece through intermediate stations and land at the final station.
   *
   * Each intermediate hop takes 200ms with ease-out cubic bezier.
   * The final landing uses a spring transition for a bounce effect.
   *
   * @param intermediateStations - Station IDs to hop through (not including start or final)
   * @param finalStation - The destination station ID
   * @returns Promise that resolves when animation completes
   */
  const startHop = useCallback(
    async (intermediateStations: number[], finalStation: number): Promise<void> => {
      setIsAnimating(true)

      // Hop through each intermediate station sequentially
      for (const station of intermediateStations) {
        const coord = STATION_COORDS[station]
        if (!coord) continue
        await animate(scope.current!, { x: coord.x, y: coord.y }, { duration: HOP_DURATION, ease: HOP_EASE })
      }

      // Land at final station with spring bounce
      const finalCoord = STATION_COORDS[finalStation]
      if (finalCoord) {
        await animate(scope.current!, { x: finalCoord.x, y: finalCoord.y }, LANDING_SPRING)
      }

      setIsAnimating(false)
    },
    [scope, animate],
  )

  /**
   * Animate a captured piece to the HOME zone coordinates.
   *
   * Uses a spring transition for a natural-feeling arc to the HOME area.
   *
   * @param targetX - X coordinate of the HOME zone position
   * @param targetY - Y coordinate of the HOME zone position
   * @returns Promise that resolves when animation completes
   */
  const animateCapture = useCallback(
    async (targetX: number, targetY: number): Promise<void> => {
      setIsAnimating(true)
      await animate(scope.current!, { x: targetX, y: targetY }, CAPTURE_SPRING)
      setIsAnimating(false)
    },
    [scope, animate],
  )

  return { scope, isAnimating, startHop, animateCapture }
}

/**
 * Apply a screen shake effect to the board container.
 *
 * Uses the Web Animations API directly on the container element
 * to create a short horizontal shake (300ms) that signals a capture event.
 *
 * @param containerRef - Ref to the board container div element
 */
export function shakeBoard(containerRef: React.RefObject<HTMLDivElement | null>): void {
  if (!containerRef.current) return
  containerRef.current.animate(
    SHAKE_KEYFRAMES.map((x) => ({ transform: `translateX(${x}px)` })),
    { duration: SHAKE_DURATION },
  )
}
