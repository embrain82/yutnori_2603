import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { Board } from '@/components/board/Board'
import { MoveHighlight } from '@/components/board/MoveHighlight'
import type { PieceState } from '@/lib/yut/types'

describe('Board', () => {
  it('renders SVG with viewBox 0 0 500 500', () => {
    const { container } = render(<Board />)
    const svg = container.querySelector('svg')
    expect(svg).not.toBeNull()
    expect(svg!.getAttribute('viewBox')).toBe('0 0 500 500')
  })

  it('renders exactly 29 station circles', () => {
    const { container } = render(<Board />)
    const stations = container.querySelectorAll('[data-station-id]')
    expect(stations).toHaveLength(29)
  })

  it('corner stations (0,5,10,15) have r=10', () => {
    const { container } = render(<Board />)
    const cornerIds = [0, 5, 10, 15]
    for (const id of cornerIds) {
      const station = container.querySelector(`[data-station-id="${id}"]`)
      expect(station).not.toBeNull()
      expect(station!.getAttribute('r')).toBe('10')
    }
  })

  it('center station (22) has r=10', () => {
    const { container } = render(<Board />)
    const center = container.querySelector('[data-station-id="22"]')
    expect(center).not.toBeNull()
    expect(center!.getAttribute('r')).toBe('10')
  })

  it('normal stations have r=6', () => {
    const { container } = render(<Board />)
    const station3 = container.querySelector('[data-station-id="3"]')
    expect(station3).not.toBeNull()
    expect(station3!.getAttribute('r')).toBe('6')
  })

  it('has aria-label for accessibility', () => {
    const { container } = render(<Board />)
    const svg = container.querySelector('svg')
    expect(svg).not.toBeNull()
    expect(svg!.getAttribute('aria-label')).toBe('윷놀이 게임판')
  })

  it('BoardBackground renders diamond polygon', () => {
    const { container } = render(<Board />)
    const polygon = container.querySelector('polygon')
    expect(polygon).not.toBeNull()
    expect(polygon!.getAttribute('fill')).toBe('#FFFDE7')
  })

  it('renders a persistent start marker on the board entry station', () => {
    const { getByTestId, getByText } = render(<Board />)

    expect(getByTestId('board-start-marker')).toBeInTheDocument()
    expect(getByText('출발')).toBeInTheDocument()
  })
})

// Helper to create a PieceState for testing
function makePiece(
  id: string,
  team: 'player' | 'ai',
  station: number,
  routeId = 'outer',
  routeIndex = 0,
): PieceState {
  return {
    id,
    team,
    position: { station, routeId, routeIndex },
    stackedPieceIds: [],
    stackedWith: null,
  }
}

describe('MoveHighlight', () => {
  it('renders pulsing circle at given coordinates with gold color by default', () => {
    const { getByTestId } = render(
      <svg>
        <MoveHighlight cx={100} cy={200} type="continue" onSelect={() => {}} />
      </svg>,
    )
    const dot = getByTestId('move-highlight-continue')
    expect(dot).toBeTruthy()
    expect(dot.getAttribute('fill')).toBe('rgba(255, 215, 0, 0.4)')
    expect(dot.getAttribute('stroke')).toBe('#FFD700')
  })

  it('renders green color when type is shortcut', () => {
    const { getByTestId } = render(
      <svg>
        <MoveHighlight cx={100} cy={200} type="shortcut" onSelect={() => {}} />
      </svg>,
    )
    const dot = getByTestId('move-highlight-shortcut')
    expect(dot).toBeTruthy()
    expect(dot.getAttribute('fill')).toBe('rgba(102, 187, 106, 0.4)')
    expect(dot.getAttribute('stroke')).toBe('#66BB6A')
  })

  it('calls onSelect when clicked', () => {
    const onSelect = vi.fn()
    const { getByTestId } = render(
      <svg>
        <MoveHighlight cx={100} cy={200} type="continue" onSelect={onSelect} />
      </svg>,
    )
    fireEvent.click(getByTestId('highlight-hit-area'))
    expect(onSelect).toHaveBeenCalledTimes(1)
  })
})

describe('Board with props', () => {
  const defaultProps = {
    pieces: [] as PieceState[],
    selectedPieceId: null,
    validDestinations: [] as Array<{
      stationId: number
      isBranchShortcut: boolean
      isBranchContinue: boolean
    }>,
    isAnimating: false,
    animatingPieceId: null,
    animatingPosition: null,
    onPieceSelect: vi.fn(),
    onDestinationSelect: vi.fn(),
  }

  it('renders PieceToken for each on-board piece (not HOME or FINISH)', () => {
    const pieces: PieceState[] = [
      makePiece('p1', 'player', 3, 'outer', 3),
      makePiece('p2', 'ai', 8, 'outer', 8),
      makePiece('p3', 'player', -1), // HOME -- should NOT render
      makePiece('p4', 'ai', -2),     // FINISH -- should NOT render
    ]
    const { container } = render(
      <Board {...defaultProps} pieces={pieces} />,
    )
    const tokens = container.querySelectorAll('[data-testid="piece-token"]')
    expect(tokens).toHaveLength(2)
    expect(container.querySelectorAll('[data-testid="player-ribbon"]')).toHaveLength(1)
    expect(container.querySelectorAll('[data-testid="ai-crest"]')).toHaveLength(1)
  })

  it('renders MoveHighlight for each valid destination when a piece is selected', () => {
    const pieces = [makePiece('p1', 'player', 3, 'outer', 3)]
    const validDestinations = [
      { stationId: 5, isBranchShortcut: false, isBranchContinue: false },
      { stationId: 7, isBranchShortcut: false, isBranchContinue: false },
    ]
    const { container } = render(
      <Board
        {...defaultProps}
        pieces={pieces}
        selectedPieceId="p1"
        validDestinations={validDestinations}
      />,
    )
    const highlights = container.querySelectorAll('[data-testid^="move-highlight"]')
    expect(highlights).toHaveLength(2)
  })

  it('does not render highlights when no piece is selected', () => {
    const pieces = [makePiece('p1', 'player', 3, 'outer', 3)]
    const validDestinations = [
      { stationId: 5, isBranchShortcut: false, isBranchContinue: false },
    ]
    const { container } = render(
      <Board
        {...defaultProps}
        pieces={pieces}
        selectedPieceId={null}
        validDestinations={validDestinations}
      />,
    )
    const highlights = container.querySelectorAll('[data-testid^="move-highlight"]')
    expect(highlights).toHaveLength(0)
  })

  it('renders branch highlights with two colors -- gold for continue, green for shortcut (D-10)', () => {
    const pieces = [makePiece('p1', 'player', 3, 'outer', 3)]
    const validDestinations = [
      { stationId: 6, isBranchShortcut: false, isBranchContinue: true },
      { stationId: 20, isBranchShortcut: true, isBranchContinue: false },
    ]
    const { container } = render(
      <Board
        {...defaultProps}
        pieces={pieces}
        selectedPieceId="p1"
        validDestinations={validDestinations}
      />,
    )
    const gold = container.querySelector('[data-testid="move-highlight-continue"]')
    const green = container.querySelector('[data-testid="move-highlight-shortcut"]')
    expect(gold).toBeTruthy()
    expect(green).toBeTruthy()
    expect(gold!.getAttribute('fill')).toBe('rgba(255, 215, 0, 0.4)')
    expect(green!.getAttribute('fill')).toBe('rgba(102, 187, 106, 0.4)')
  })

  it('does not render interaction elements when isAnimating is true', () => {
    const pieces = [makePiece('p1', 'player', 3, 'outer', 3)]
    const validDestinations = [
      { stationId: 5, isBranchShortcut: false, isBranchContinue: false },
    ]
    const { container } = render(
      <Board
        {...defaultProps}
        pieces={pieces}
        selectedPieceId="p1"
        validDestinations={validDestinations}
        isAnimating={true}
      />,
    )
    // No highlights during animation
    const highlights = container.querySelectorAll('[data-testid^="move-highlight"]')
    expect(highlights).toHaveLength(0)
    // No selectable hit areas during animation
    const hitAreas = container.querySelectorAll('[data-testid="piece-hit-area"]')
    expect(hitAreas).toHaveLength(0)
  })

  it('renders the animating piece with the same character token art', () => {
    const pieces = [makePiece('p1', 'player', 3, 'outer', 3)]
    const { container } = render(
      <Board
        {...defaultProps}
        pieces={pieces}
        isAnimating={true}
        animatingPieceId="p1"
        animatingPosition={{ x: 120, y: 180 }}
      />,
    )

    const animatingPiece = container.querySelector('[data-testid="animating-piece"]')
    expect(animatingPiece).not.toBeNull()
    expect(
      animatingPiece?.querySelector('[data-testid="player-ribbon"]'),
    ).not.toBeNull()
  })
})
