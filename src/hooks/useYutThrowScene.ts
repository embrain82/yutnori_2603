'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  createYutThrowScene,
  type YutThrowSceneController,
  type YutThrowScenePhase,
} from '@/lib/throw3d/createYutThrowScene'
import type { ThrowResult } from '@/lib/yut/types'

export interface UseYutThrowSceneResult {
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  phase: 'idle' | 'launching' | 'settling' | 'revealing' | 'disposed'
  revealedResult: ThrowResult | null
  throwOnce: (result: ThrowResult) => Promise<void>
  resetReveal: () => void
}

export function useYutThrowScene(): UseYutThrowSceneResult {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const controllerRef = useRef<YutThrowSceneController | null>(null)
  const [phase, setPhase] = useState<YutThrowScenePhase>('idle')
  const [revealedResult, setRevealedResult] = useState<ThrowResult | null>(null)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!canvasRef.current || controllerRef.current) return

    controllerRef.current = createYutThrowScene({
      canvas: canvasRef.current,
      onPhaseChange: setPhase,
      onReveal: setRevealedResult,
    })
  })

  useEffect(() => {
    return () => {
      controllerRef.current?.dispose()
      controllerRef.current = null
    }
  }, [])

  const throwOnce = useCallback(async (result: ThrowResult): Promise<void> => {
    if (!controllerRef.current) return
    await controllerRef.current.startThrow(result)
  }, [])

  const resetReveal = useCallback((): void => {
    setRevealedResult(null)
  }, [])

  return {
    canvasRef,
    phase,
    revealedResult,
    throwOnce,
    resetReveal,
  }
}
