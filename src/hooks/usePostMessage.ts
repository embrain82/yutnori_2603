'use client'

import { useEffect, useEffectEvent, useRef } from 'react'
import { useGameStore } from '@/store/gameStore'
import type {
  CouponConfig,
  YutCouponConfigMessage,
  YutGameEndMessage,
  YutGameStartMessage,
  YutGameWinMessage,
} from '@/lib/yut'

export function usePostMessage(): void {
  const phase = useGameStore((state) => state.phase)
  const session = useGameStore((state) => state.session)
  const setCouponConfig = useGameStore((state) => state.setCouponConfig)
  const targetOrigin = process.env.NEXT_PUBLIC_ALLOWED_ORIGIN || '*'
  const hasSentStartRef = useRef(false)
  const hasSentEndRef = useRef(false)
  const hasSentWinRef = useRef(false)

  useEffect(() => {
    function handleMessage(event: MessageEvent<YutCouponConfigMessage>) {
      if (targetOrigin !== '*' && event.origin !== targetOrigin) {
        return
      }

      if (!event.data || event.data.type !== 'YUT_COUPON_CONFIG') {
        return
      }

      const config: CouponConfig = {
        couponCode: event.data.couponCode,
        ...(event.data.couponImage ? { couponImage: event.data.couponImage } : {}),
        ...(event.data.couponText ? { couponText: event.data.couponText } : {}),
      }

      setCouponConfig(config)
    }

    window.addEventListener('message', handleMessage)
    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [setCouponConfig, targetOrigin])

  useEffect(() => {
    if (phase === 'idle') {
      hasSentStartRef.current = false
      hasSentEndRef.current = false
      hasSentWinRef.current = false
    }
  }, [phase])

  const postToParent = useEffectEvent((
    message: YutGameStartMessage | YutGameEndMessage | YutGameWinMessage
  ): boolean => {
    if (window.parent === window) {
      return false
    }

    window.parent.postMessage(message, targetOrigin)
    return true
  })

  useEffect(() => {
    if (phase === 'idle' || !session.startedAt || hasSentStartRef.current) {
      return
    }

    const message: YutGameStartMessage = {
      type: 'YUT_GAME_START',
      payload: {
        sessionId: session.sessionId,
        startedAt: session.startedAt,
      },
    }

    if (postToParent(message)) {
      hasSentStartRef.current = true
    }
  }, [phase, session, targetOrigin])

  useEffect(() => {
    if (
      (phase !== 'victory' && phase !== 'defeat') ||
      !session.completedAt ||
      hasSentEndRef.current
    ) {
      return
    }

    const message: YutGameEndMessage = {
      type: 'YUT_GAME_END',
      payload: {
        sessionId: session.sessionId,
        completedAt: session.completedAt,
        winner: session.winner,
      },
    }

    if (postToParent(message)) {
      hasSentEndRef.current = true
    }
  }, [phase, session, targetOrigin])

  useEffect(() => {
    if (phase !== 'victory' || !session.completedAt || hasSentWinRef.current) {
      return
    }

    const message: YutGameWinMessage = {
      type: 'YUT_GAME_WIN',
      payload: session,
    }

    if (postToParent(message)) {
      hasSentWinRef.current = true
    }
  }, [phase, session, targetOrigin])
}
