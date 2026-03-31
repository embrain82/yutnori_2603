import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Game from '@/components/Game'

let storeState: Record<string, unknown>
const usePostMessageMock = vi.fn()

vi.mock('@/store/gameStore', () => ({
  useGameStore: vi.fn((selector: (state: Record<string, unknown>) => unknown) => selector(storeState)),
}))

vi.mock('@/hooks/usePostMessage', () => ({
  usePostMessage: () => usePostMessageMock(),
}))

vi.mock('motion/react', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: {
    div: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  },
}))

vi.mock('@/components/screens/IdleScreen', () => ({
  IdleScreen: () => <div>idle-screen</div>,
}))

vi.mock('@/components/screens/PlayScreen', () => ({
  PlayScreen: () => <div>play-screen</div>,
}))

vi.mock('@/components/screens/ResultScreen', () => ({
  ResultScreen: () => <div>result-screen</div>,
}))

vi.mock('@/components/effects/VictoryConfetti', () => ({
  VictoryConfetti: () => <div>victory-confetti</div>,
}))

vi.mock('@/components/effects/DefeatEffect', () => ({
  DefeatEffect: ({ children }: { children: React.ReactNode }) => (
    <div>
      <div>defeat-effect</div>
      {children}
    </div>
  ),
}))

describe('Game', () => {
  beforeEach(() => {
    storeState = { phase: 'idle', runAiTurn: vi.fn() }
    usePostMessageMock.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders IdleScreen when phase is idle', () => {
    render(<Game />)

    expect(screen.getByText('idle-screen')).toBeInTheDocument()
  })

  it('renders PlayScreen for active gameplay phases', () => {
    storeState = { phase: 'readyToThrow' }

    render(<Game />)

    expect(screen.getByText('play-screen')).toBeInTheDocument()
  })

  it('renders ResultScreen for victory', () => {
    storeState = { phase: 'victory' }

    render(<Game />)

    expect(screen.getByText('result-screen')).toBeInTheDocument()
    expect(screen.getByText('victory-confetti')).toBeInTheDocument()
  })

  it('renders ResultScreen for defeat', () => {
    storeState = { phase: 'defeat' }

    render(<Game />)

    expect(screen.getByText('result-screen')).toBeInTheDocument()
    expect(screen.getByText('defeat-effect')).toBeInTheDocument()
  })

  it('runs the AI turn after 900ms in aiThinking', () => {
    vi.useFakeTimers()
    const runAiTurn = vi.fn()
    storeState = { phase: 'aiThinking', runAiTurn }

    render(<Game />)

    act(() => {
      vi.advanceTimersByTime(899)
    })
    expect(runAiTurn).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(runAiTurn).toHaveBeenCalledTimes(1)
  })

  it('keeps the same AI turn timer even if the callback reference changes mid-wait', () => {
    vi.useFakeTimers()
    const firstRunAiTurn = vi.fn()
    const secondRunAiTurn = vi.fn()
    storeState = { phase: 'aiThinking', runAiTurn: firstRunAiTurn }

    const view = render(<Game />)

    act(() => {
      vi.advanceTimersByTime(500)
    })

    storeState = { phase: 'aiThinking', runAiTurn: secondRunAiTurn }
    view.rerender(<Game />)

    act(() => {
      vi.advanceTimersByTime(399)
    })
    expect(firstRunAiTurn).not.toHaveBeenCalled()
    expect(secondRunAiTurn).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(firstRunAiTurn).not.toHaveBeenCalled()
    expect(secondRunAiTurn).toHaveBeenCalledTimes(1)
  })
})
