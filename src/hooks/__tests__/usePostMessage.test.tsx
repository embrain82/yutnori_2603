import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createSession } from '@/lib/yut'
import { usePostMessage } from '@/hooks/usePostMessage'
import { initialState, useGameStore } from '@/store/gameStore'

function resetStore() {
  useGameStore.setState({
    ...initialState,
  })
}

describe('usePostMessage', () => {
  const originalParent = window.parent
  const postMessageSpy = vi.fn()

  beforeEach(() => {
    resetStore()
    postMessageSpy.mockReset()
    Object.defineProperty(window, 'parent', {
      configurable: true,
      value: {
        postMessage: postMessageSpy,
      },
    })
    process.env.NEXT_PUBLIC_ALLOWED_ORIGIN = 'https://allowed.example'
  })

  afterEach(() => {
    Object.defineProperty(window, 'parent', {
      configurable: true,
      value: originalParent,
    })
    delete process.env.NEXT_PUBLIC_ALLOWED_ORIGIN
  })

  it('stores coupon config from an allowed YUT_COUPON_CONFIG message', () => {
    renderHook(() => usePostMessage())

    act(() => {
      window.dispatchEvent(
        new MessageEvent('message', {
          origin: 'https://allowed.example',
          data: {
            type: 'YUT_COUPON_CONFIG',
            couponCode: 'YUT-777',
            couponText: '승리 보상',
          },
        })
      )
    })

    expect(useGameStore.getState().couponConfig).toEqual({
      couponCode: 'YUT-777',
      couponText: '승리 보상',
    })
  })

  it('posts start, end, and win messages exactly once for a completed victory flow', () => {
    const session = createSession()
    const { rerender } = renderHook(() => usePostMessage())

    act(() => {
      useGameStore.setState({
        ...useGameStore.getState(),
        phase: 'readyToThrow',
        session,
      })
    })

    rerender()
    rerender()

    const finalized = {
      ...session,
      completedAt: '2026-04-01T00:00:00.000Z',
      winner: 'player' as const,
    }

    act(() => {
      useGameStore.setState({
        ...useGameStore.getState(),
        phase: 'victory',
        session: finalized,
      })
    })

    rerender()
    rerender()

    expect(postMessageSpy).toHaveBeenCalledTimes(3)
    expect(postMessageSpy).toHaveBeenNthCalledWith(
      1,
      {
        type: 'YUT_GAME_START',
        payload: {
          sessionId: session.sessionId,
          startedAt: session.startedAt,
        },
      },
      'https://allowed.example'
    )
    expect(postMessageSpy).toHaveBeenNthCalledWith(
      2,
      {
        type: 'YUT_GAME_END',
        payload: {
          sessionId: finalized.sessionId,
          completedAt: finalized.completedAt,
          winner: 'player',
        },
      },
      'https://allowed.example'
    )
    expect(postMessageSpy).toHaveBeenNthCalledWith(
      3,
      {
        type: 'YUT_GAME_WIN',
        payload: finalized,
      },
      'https://allowed.example'
    )
  })
})
