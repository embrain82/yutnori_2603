import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RESULT_LABELS } from '@/components/throw/ThrowResultCard'
import { YutThrowOverlay } from '@/components/throw/YutThrowOverlay'
import { useYutThrowScene } from '@/hooks/useYutThrowScene'
import type { ThrowResult } from '@/lib/yut/types'

const mockThrowOnce = vi.fn<(_: ThrowResult) => Promise<void>>()
const mockResetReveal = vi.fn()

let hookState: ReturnType<typeof useYutThrowScene>

vi.mock('@/hooks/useYutThrowScene', () => ({
  useYutThrowScene: vi.fn(),
}))

describe('YutThrowOverlay', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mockThrowOnce.mockReset()
    mockResetReveal.mockReset()
    mockThrowOnce.mockResolvedValue(undefined)

    hookState = {
      canvasRef: { current: null },
      phase: 'idle',
      revealedResult: null,
      throwOnce: mockThrowOnce,
      resetReveal: mockResetReveal,
    }

    vi.mocked(useYutThrowScene).mockImplementation(() => hookState)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders a canvas container when open is true', () => {
    render(
      <YutThrowOverlay
        open
        result={{ name: 'do', steps: 1, grantsExtra: false }}
        onComplete={vi.fn()}
      />,
    )

    expect(screen.getByTestId('yut-throw-canvas')).toBeInTheDocument()
  })

  it('calls throwOnce(result) exactly once when opened with a result', async () => {
    const result: ThrowResult = { name: 'gae', steps: 2, grantsExtra: false }
    const view = render(<YutThrowOverlay open result={result} onComplete={vi.fn()} />)

    await act(async () => {
      await Promise.resolve()
    })

    expect(mockThrowOnce).toHaveBeenCalledTimes(1)
    view.rerender(<YutThrowOverlay open result={result} onComplete={vi.fn()} />)

    expect(mockThrowOnce).toHaveBeenCalledTimes(1)
    expect(mockThrowOnce).toHaveBeenCalledWith(result)
  })

  it('renders 도, 개, 걸, 윷, 모 through the result-card mapping', () => {
    expect(RESULT_LABELS).toEqual({
      do: '도',
      gae: '개',
      geol: '걸',
      yut: '윷',
      mo: '모',
    })
  })

  it('shows the result card only when the phase reaches revealing', () => {
    const result: ThrowResult = { name: 'geol', steps: 3, grantsExtra: false }
    const view = render(<YutThrowOverlay open result={result} onComplete={vi.fn()} />)

    expect(screen.queryByText('걸')).not.toBeInTheDocument()

    hookState = {
      ...hookState,
      phase: 'revealing',
      revealedResult: result,
    }

    view.rerender(<YutThrowOverlay open result={result} onComplete={vi.fn()} />)

    expect(screen.getByText('걸')).toBeInTheDocument()
  })

  it('calls onComplete after revealing', () => {
    const onComplete = vi.fn()
    const result: ThrowResult = { name: 'mo', steps: 5, grantsExtra: true }

    hookState = {
      ...hookState,
      phase: 'revealing',
      revealedResult: result,
    }

    render(<YutThrowOverlay open result={result} onComplete={onComplete} />)

    act(() => {
      vi.advanceTimersByTime(349)
    })

    expect(onComplete).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(1)
    })

    expect(onComplete).toHaveBeenCalledTimes(1)
  })
})
