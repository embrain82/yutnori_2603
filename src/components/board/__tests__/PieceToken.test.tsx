/**
 * PieceToken component tests.
 *
 * Verifies team-colored SVG tokens with stack badge, glow ring,
 * selection ring, and invisible hit area for 44px+ touch targets.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PieceToken } from '@/components/board/PieceToken'

vi.mock('motion/react')

describe('PieceToken', () => {
  const defaultProps = {
    cx: 100,
    cy: 100,
    team: 'player' as const,
    stackCount: 1,
    isSelectable: false,
    isSelected: false,
    onSelect: vi.fn(),
  }

  it('renders player token with blue fill (#42A5F5) and stroke (#1565C0)', () => {
    render(
      <svg>
        <PieceToken {...defaultProps} team="player" />
      </svg>,
    )
    const token = screen.getByTestId('piece-token')
    expect(token).toHaveAttribute('fill', '#42A5F5')
    expect(token).toHaveAttribute('stroke', '#1565C0')
    expect(screen.getByTestId('player-ribbon')).toBeInTheDocument()
  })

  it('renders AI token with red fill (#EF5350) and stroke (#C62828)', () => {
    render(
      <svg>
        <PieceToken {...defaultProps} team="ai" />
      </svg>,
    )
    const token = screen.getByTestId('piece-token')
    expect(token).toHaveAttribute('fill', '#EF5350')
    expect(token).toHaveAttribute('stroke', '#C62828')
    expect(screen.getByTestId('ai-crest')).toBeInTheDocument()
  })

  it('shows stack badge with count 2 when stackCount is 2', () => {
    render(
      <svg>
        <PieceToken {...defaultProps} stackCount={2} />
      </svg>,
    )
    const badge = screen.getByTestId('stack-badge')
    expect(badge).toHaveTextContent('2')
  })

  it('does not show stack badge when stackCount is 1', () => {
    render(
      <svg>
        <PieceToken {...defaultProps} stackCount={1} />
      </svg>,
    )
    expect(screen.queryByTestId('stack-badge')).toBeNull()
  })

  it('renders glow ring circle when isSelectable is true', () => {
    render(
      <svg>
        <PieceToken {...defaultProps} isSelectable={true} />
      </svg>,
    )
    expect(screen.getByTestId('glow-ring')).toBeInTheDocument()
  })

  it('does not render glow ring when isSelectable is false', () => {
    render(
      <svg>
        <PieceToken {...defaultProps} isSelectable={false} />
      </svg>,
    )
    expect(screen.queryByTestId('glow-ring')).toBeNull()
  })

  it('renders selection ring when isSelected is true', () => {
    const { container } = render(
      <svg>
        <PieceToken {...defaultProps} isSelected={true} />
      </svg>,
    )
    const selectionRing = screen.getByTestId('selection-ring')
    const characterDetails = screen.getByTestId('character-details')

    expect(selectionRing).toBeInTheDocument()
    expect(
      characterDetails.compareDocumentPosition(selectionRing)
        & Node.DOCUMENT_POSITION_FOLLOWING,
    ).not.toBe(0)
    expect(container.querySelector('[data-testid="selection-ring"]')).not.toBeNull()
  })

  it('calls onSelect when invisible hit area is clicked', () => {
    const onSelect = vi.fn()
    render(
      <svg>
        <PieceToken
          {...defaultProps}
          isSelectable={true}
          onSelect={onSelect}
        />
      </svg>,
    )
    fireEvent.click(screen.getByTestId('piece-hit-area'))
    expect(onSelect).toHaveBeenCalledTimes(1)
  })

  it('invisible hit area has r=22 for 44px+ touch target', () => {
    render(
      <svg>
        <PieceToken {...defaultProps} isSelectable={true} />
      </svg>,
    )
    const hitArea = screen.getByTestId('piece-hit-area')
    expect(hitArea).toHaveAttribute('r', '22')
  })

  it('does not render hit area when isSelectable is false', () => {
    render(
      <svg>
        <PieceToken {...defaultProps} isSelectable={false} />
      </svg>,
    )
    expect(screen.queryByTestId('piece-hit-area')).toBeNull()
  })
})
