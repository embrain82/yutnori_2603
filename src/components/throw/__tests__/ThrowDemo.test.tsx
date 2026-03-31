import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Home from '@/app/page'
import { ThrowDemo } from '@/components/throw/ThrowDemo'
import { generateThrow } from '@/lib/yut/throw'

const mockGenerateThrow = vi.mocked(generateThrow)

vi.mock('@/lib/yut/throw', () => ({
  generateThrow: vi.fn(),
}))

vi.mock('@/components/board/Board', () => ({
  Board: () => <div data-testid="board" />,
}))

vi.mock('next/dynamic', () => ({
  default: () => function MockDynamicGame() {
    return <div>game-shell</div>
  },
}))

vi.mock('@/components/throw/YutThrowOverlay', () => ({
  YutThrowOverlay: ({
    open,
    onComplete,
  }: {
    open: boolean
    result: unknown
    onComplete: () => void
  }) => (
    <div>
      <div data-testid="overlay-state">{open ? 'open' : 'closed'}</div>
      <button type="button" onClick={onComplete}>
        overlay-complete
      </button>
    </div>
  ),
}))

describe('ThrowDemo', () => {
  beforeEach(() => {
    mockGenerateThrow.mockReset()
    mockGenerateThrow.mockReturnValue({ name: 'gae', steps: 2, grantsExtra: false })
  })

  it('renders the throw button and static board', () => {
    render(<ThrowDemo />)

    expect(screen.getByRole('button', { name: '던지기' })).toBeInTheDocument()
    expect(screen.getByTestId('board')).toBeInTheDocument()
  })

  it('clicking the button calls generateThrow once and opens the overlay', async () => {
    const user = userEvent.setup()
    render(<ThrowDemo />)

    await user.click(screen.getByRole('button', { name: '던지기' }))

    expect(mockGenerateThrow).toHaveBeenCalledTimes(1)
    expect(screen.getByTestId('overlay-state')).toHaveTextContent('open')
  })

  it('disables the button while a throw is active', async () => {
    const user = userEvent.setup()
    render(<ThrowDemo />)

    const button = screen.getByRole('button', { name: '던지기' })

    await user.click(button)

    expect(button).toBeDisabled()
  })

  it('closes the active throw and re-enables the button after onComplete', async () => {
    const user = userEvent.setup()
    render(<ThrowDemo />)

    const button = screen.getByRole('button', { name: '던지기' })

    await user.click(button)
    await user.click(screen.getByRole('button', { name: 'overlay-complete' }))

    expect(screen.getByTestId('overlay-state')).toHaveTextContent('closed')
    expect(button).not.toBeDisabled()
  })

  it('page default export renders the real game entry instead of the throw preview', () => {
    render(<Home />)

    expect(screen.getByText('game-shell')).toBeInTheDocument()
  })
})
