import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ResultScreen } from '@/components/screens/ResultScreen'

const restartGame = vi.fn()
let storeState: Record<string, unknown>

vi.mock('@/store/gameStore', () => ({
  useGameStore: vi.fn((selector: (state: Record<string, unknown>) => unknown) => selector(storeState)),
}))

describe('ResultScreen', () => {
  beforeEach(() => {
    restartGame.mockReset()
    storeState = {
      phase: 'victory',
      couponConfig: {
        couponCode: 'WIN-123',
        couponText: '당첨 축하',
      },
      restartGame,
    }
  })

  it('renders 축하합니다! on victory', () => {
    render(<ResultScreen />)

    expect(screen.getByText('축하합니다!')).toBeInTheDocument()
  })

  it('renders 아쉽네요... on defeat', () => {
    storeState = {
      ...storeState,
      phase: 'defeat',
    }

    render(<ResultScreen />)

    expect(screen.getByText('아쉽네요...')).toBeInTheDocument()
  })

  it('renders coupon area on victory when couponConfig exists', () => {
    render(<ResultScreen />)

    expect(screen.getByTestId('coupon-area')).toBeInTheDocument()
    expect(screen.getByText('WIN-123')).toBeInTheDocument()
    expect(screen.getByText('승리 기념 선물이 도착했어요.')).toBeInTheDocument()
  })

  it('calls restartGame when retry button is clicked', () => {
    render(<ResultScreen />)

    fireEvent.click(screen.getByText('한 번 더 하기'))

    expect(restartGame).toHaveBeenCalledTimes(1)
  })

  it('renders warmer defeat copy and a clear retry CTA', () => {
    storeState = {
      ...storeState,
      phase: 'defeat',
    }

    render(<ResultScreen />)

    expect(screen.getByText('거의 따라잡았어요. 한 번만 더 던지면 흐름을 바꿀 수 있어요.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '다시 도전' })).toBeInTheDocument()
  })
})
