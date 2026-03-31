'use client'

import { useEffect, useRef } from 'react'
import { ThrowResultCard } from '@/components/throw/ThrowResultCard'
import { useYutThrowScene } from '@/hooks/useYutThrowScene'
import type { ThrowResult } from '@/lib/yut/types'

interface YutThrowOverlayProps {
  open: boolean
  result: ThrowResult | null
  onComplete: () => void
}

export function YutThrowOverlay({
  open,
  result,
  onComplete,
}: YutThrowOverlayProps): React.JSX.Element {
  const { canvasRef, phase, revealedResult, throwOnce, resetReveal } = useYutThrowScene()
  const launchedResultRef = useRef<ThrowResult | null>(null)

  useEffect(() => {
    if (!open) {
      launchedResultRef.current = null
      resetReveal()
      return
    }

    if (!result) return

    // This guard keeps one open cycle from relaunching the same throw while hook state updates.
    if (launchedResultRef.current === result) return

    launchedResultRef.current = result
    void throwOnce(result)
  }, [open, result, resetReveal, throwOnce])

  useEffect(() => {
    if (!open || phase !== 'revealing' || !revealedResult) return

    const timerId = window.setTimeout(() => {
      onComplete()
    }, 700)

    return () => {
      window.clearTimeout(timerId)
    }
  }, [open, phase, revealedResult, onComplete])

  return (
    <div
      aria-hidden={!open}
      className={[
        'absolute inset-0 z-20 transition-opacity duration-200',
        open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
      ].join(' ')}
    >
      <div className="absolute inset-0 bg-white/15 backdrop-blur-[2px]" />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="relative aspect-[5/4] w-full max-w-[500px] overflow-hidden rounded-3xl bg-[radial-gradient(circle_at_top,#fff6df_0%,#f1e1b5_35%,#d8b780_100%)] shadow-[0_24px_60px_rgba(88,58,26,0.2)]">
          <canvas ref={canvasRef} data-testid="yut-throw-canvas" className="h-full w-full" />
          {phase === 'revealing' && revealedResult ? (
            <ThrowResultCard result={revealedResult} />
          ) : null}
        </div>
      </div>
    </div>
  )
}
