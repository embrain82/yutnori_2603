import { act, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { VictoryConfetti } from '@/components/effects/VictoryConfetti'

let storeState: Record<string, unknown>

const { confettiMock } = vi.hoisted(() => {
  const mock = vi.fn()
  mock.reset = vi.fn()
  return { confettiMock: mock }
})

vi.mock('@/store/gameStore', () => ({
  useGameStore: vi.fn((selector: (state: Record<string, unknown>) => unknown) => selector(storeState)),
}))

vi.mock('canvas-confetti', () => ({
  default: confettiMock,
}))

describe('VictoryConfetti', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    confettiMock.mockReset()
    confettiMock.reset.mockReset()
    storeState = { phase: 'victory' }
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('fires confetti bursts exactly once while victory stays active', () => {
    const { rerender } = render(<VictoryConfetti />)

    expect(confettiMock).toHaveBeenCalledTimes(1)

    act(() => {
      vi.advanceTimersByTime(1500)
    })
    expect(confettiMock).toHaveBeenCalledTimes(4)

    rerender(<VictoryConfetti />)
    expect(confettiMock).toHaveBeenCalledTimes(4)
  })

  it('resets after leaving victory so a replayed win can fire again', () => {
    const { rerender } = render(<VictoryConfetti />)

    act(() => {
      vi.advanceTimersByTime(1500)
    })
    expect(confettiMock).toHaveBeenCalledTimes(4)

    storeState = { phase: 'readyToThrow' }
    rerender(<VictoryConfetti />)

    storeState = { phase: 'victory' }
    rerender(<VictoryConfetti />)

    expect(confettiMock).toHaveBeenCalledTimes(5)
  })

  it('cleans up timers and resets confetti on unmount', () => {
    const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout')
    const { unmount } = render(<VictoryConfetti />)

    unmount()
    act(() => {
      vi.advanceTimersByTime(1500)
    })

    expect(confettiMock.reset).toHaveBeenCalled()
    expect(clearTimeoutSpy).toHaveBeenCalled()
  })
})
