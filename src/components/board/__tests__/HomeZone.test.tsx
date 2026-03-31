/**
 * HomeZone component tests.
 *
 * Verifies off-board piece display areas with team-colored zones,
 * Korean labels, correct piece counts, and selectable piece interaction.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { HomeZone } from '@/components/board/HomeZone'

vi.mock('motion/react')

describe('HomeZone', () => {
  const defaultProps = {
    playerHomePieces: [
      { id: 'p1', team: 'player' as const, stackCount: 1 },
      { id: 'p2', team: 'player' as const, stackCount: 1 },
    ],
    aiHomePieces: [
      { id: 'a1', team: 'ai' as const, stackCount: 1 },
      { id: 'a2', team: 'ai' as const, stackCount: 1 },
    ],
    selectablePieceIds: [] as string[],
    selectedPieceId: null as string | null,
    onPieceSelect: vi.fn(),
  }

  it("renders player HOME zone with label '내 말'", () => {
    render(<HomeZone {...defaultProps} />)
    expect(screen.getByText('내 말')).toBeInTheDocument()
  })

  it("renders AI HOME zone with label '상대 말'", () => {
    render(<HomeZone {...defaultProps} />)
    expect(screen.getByText('상대 말')).toBeInTheDocument()
  })

  it('renders player HOME zone with background color #E3F2FD', () => {
    render(<HomeZone {...defaultProps} />)
    const zone = screen.getByTestId('home-zone-player')
    expect(zone).toHaveStyle({ backgroundColor: '#E3F2FD' })
  })

  it('renders AI HOME zone with background color #FFEBEE', () => {
    render(<HomeZone {...defaultProps} />)
    const zone = screen.getByTestId('home-zone-ai')
    expect(zone).toHaveStyle({ backgroundColor: '#FFEBEE' })
  })

  it('displays correct number of HOME pieces for each team', () => {
    render(<HomeZone {...defaultProps} />)
    // Each piece renders a piece-token testid inside an SVG
    const tokens = screen.getAllByTestId('piece-token')
    expect(tokens).toHaveLength(4) // 2 player + 2 AI
    expect(screen.getAllByTestId('player-ribbon')).toHaveLength(2)
    expect(screen.getAllByTestId('ai-crest')).toHaveLength(2)
  })

  it('calls onPieceSelect when a selectable HOME piece is clicked', () => {
    const onPieceSelect = vi.fn()
    render(
      <HomeZone
        {...defaultProps}
        selectablePieceIds={['p1']}
        onPieceSelect={onPieceSelect}
      />,
    )
    const hitArea = screen.getByTestId('piece-hit-area')
    fireEvent.click(hitArea)
    expect(onPieceSelect).toHaveBeenCalledWith('p1')
  })

  it('HOME pieces with IDs in selectablePieceIds are marked selectable', () => {
    render(
      <HomeZone
        {...defaultProps}
        selectablePieceIds={['p1', 'a2']}
      />,
    )
    // Selectable pieces render glow-ring elements
    const glowRings = screen.getAllByTestId('glow-ring')
    expect(glowRings).toHaveLength(2)
  })
})
