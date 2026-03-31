import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AI_REACTION_EMOJIS } from '@/components/game/AiReactionBubble'
import { PlayScreen } from '@/components/screens/PlayScreen'

const actions = {
  startThrow: vi.fn(),
  finishThrowReveal: vi.fn(),
  selectPiece: vi.fn(),
  selectDestination: vi.fn(),
  resolveStack: vi.fn(),
  completeAnimation: vi.fn(),
}

let storeState: Record<string, unknown>

vi.mock('@/store/gameStore', () => ({
  useGameStore: vi.fn((selector: (state: Record<string, unknown>) => unknown) => selector(storeState)),
}))

vi.mock('@/components/board/Board', () => ({
  Board: ({
    onPieceSelect,
    onDestinationSelect,
    validDestinations,
  }: {
    onPieceSelect: (pieceId: string) => void
    onDestinationSelect: (stationId: number) => void
    validDestinations: Array<{ stationId: number }>
  }) => (
    <div data-testid="board">
      <button type="button" onClick={() => onPieceSelect('p1')}>
        board-piece
      </button>
      <button
        type="button"
        onClick={() => onDestinationSelect(validDestinations[0]?.stationId ?? 1)}
      >
        board-destination
      </button>
    </div>
  ),
}))

vi.mock('@/components/board/HomeZone', () => ({
  HomeZone: ({
    selectablePieceIds,
    onPieceSelect,
  }: {
    selectablePieceIds: string[]
    onPieceSelect: (pieceId: string) => void
  }) => (
    <div data-testid="home-zone">
      <button
        type="button"
        onClick={() => onPieceSelect(selectablePieceIds[0] ?? 'p1')}
      >
        home-piece
      </button>
    </div>
  ),
}))

vi.mock('@/components/throw/YutThrowOverlay', () => ({
  YutThrowOverlay: ({ open }: { open: boolean }) => (
    <div data-testid="throw-overlay">{open ? 'open' : 'closed'}</div>
  ),
}))

vi.mock('@/hooks/useHopAnimation', () => ({
  useHopAnimation: () => ({
    scope: { current: null },
    isAnimating: false,
    startHop: vi.fn().mockResolvedValue(undefined),
    animateCapture: vi.fn().mockResolvedValue(undefined),
  }),
  shakeBoard: vi.fn(),
}))

vi.mock('@/lib/yut/throw', () => ({
  generateThrow: vi.fn(() => ({ name: 'gae', steps: 2, grantsExtra: false })),
}))

describe('PlayScreen', () => {
  beforeEach(() => {
    Object.values(actions).forEach((spy) => spy.mockReset())
    storeState = {
      phase: 'readyToThrow',
      pieces: [],
      turnState: {
        activeTeam: 'player',
        throwsRemaining: 1,
        pendingMoves: [],
      },
      selectedPieceId: null,
      validDestinations: [{ stationId: 1, isBranchShortcut: false, isBranchContinue: false }],
      activeThrow: null,
      activeMove: null,
      moveCandidates: [{ pieceId: 'p1' }],
      pendingAnimation: null,
      pendingStack: null,
      aiReaction: 'neutral',
      ...actions,
    }
  })

  it('renders 내 차례 on the player turn', () => {
    render(<PlayScreen />)

    expect(screen.getByText('내 차례')).toBeInTheDocument()
  })

  it('renders AI 차례 and 생각 중... during aiThinking', () => {
    storeState = {
      ...storeState,
      phase: 'aiThinking',
      turnState: {
        activeTeam: 'ai',
        throwsRemaining: 1,
        pendingMoves: [],
      },
    }

    render(<PlayScreen />)

    expect(screen.getByText('AI 차례')).toBeInTheDocument()
    expect(screen.getByText('생각 중...')).toBeInTheDocument()
  })

  it('uses the exact AI emoji mapping', () => {
    expect(AI_REACTION_EMOJIS).toEqual({
      neutral: '🙂',
      excited: '😄',
      worried: '😟',
      smug: '😏',
    })
  })

  it('shows the throw button only during the player readyToThrow state', () => {
    const view = render(<PlayScreen />)

    expect(screen.getByText('윷 던지기')).toBeInTheDocument()

    storeState = {
      ...storeState,
      phase: 'aiThinking',
      turnState: {
        activeTeam: 'ai',
        throwsRemaining: 1,
        pendingMoves: [],
      },
    }

    view.rerender(<PlayScreen />)

    expect(screen.queryByText('윷 던지기')).toBeNull()
  })

  it('routes piece selection through selectPiece', () => {
    render(<PlayScreen />)

    fireEvent.click(screen.getByText('home-piece'))

    expect(actions.selectPiece).toHaveBeenCalledWith('p1')
  })

  it('renders HomeZone and Board', () => {
    render(<PlayScreen />)

    expect(screen.getByTestId('home-zone')).toBeInTheDocument()
    expect(screen.getByTestId('board')).toBeInTheDocument()
  })

  it('hides the currently throwing result from Queue until reveal completes', () => {
    storeState = {
      ...storeState,
      phase: 'throwing',
      activeThrow: { name: 'gae', steps: 2, grantsExtra: false },
      turnState: {
        activeTeam: 'player',
        throwsRemaining: 0,
        pendingMoves: [{ name: 'gae', steps: 2, grantsExtra: false }],
      },
    }

    render(<PlayScreen />)

    expect(screen.getByText('대기 중인 윷 없음')).toBeInTheDocument()
    expect(screen.queryByText('개')).toBeNull()
  })

  it('shows the move route summary while a piece is animating', () => {
    storeState = {
      ...storeState,
      phase: 'animatingMove',
      pieces: [
        {
          id: 'p1',
          team: 'player',
          position: { station: 5, routeId: 'outer', routeIndex: 5 },
          stackedPieceIds: [],
          stackedWith: null,
        },
      ],
      pendingAnimation: {
        pieceId: 'p1',
        fromStation: -1,
        intermediateStations: [],
        finalStation: 5,
        capturedPieceIds: [],
      },
    }

    render(<PlayScreen />)

    expect(screen.getByTestId('move-route-panel')).toBeInTheDocument()
    expect(screen.getAllByText('HOME').length).toBeGreaterThan(0)
    expect(screen.getAllByText('S5').length).toBeGreaterThan(0)
  })

  it('shows a capture effect badge after the hop resolves', async () => {
    storeState = {
      ...storeState,
      phase: 'animatingMove',
      pieces: [
        {
          id: 'p1',
          team: 'player',
          position: { station: 5, routeId: 'outer', routeIndex: 5 },
          stackedPieceIds: [],
          stackedWith: null,
        },
      ],
      pendingAnimation: {
        pieceId: 'p1',
        fromStation: 3,
        intermediateStations: [4],
        finalStation: 5,
        capturedPieceIds: ['ai1'],
      },
    }

    render(<PlayScreen />)

    await waitFor(() => {
      expect(screen.getByText('잡았어!')).toBeInTheDocument()
    })
  })

  it('shows a stack effect badge before the stack prompt resolves', async () => {
    storeState = {
      ...storeState,
      phase: 'animatingMove',
      pieces: [
        {
          id: 'p1',
          team: 'player',
          position: { station: 5, routeId: 'outer', routeIndex: 5 },
          stackedPieceIds: [],
          stackedWith: null,
        },
      ],
      pendingAnimation: {
        pieceId: 'p1',
        fromStation: 3,
        intermediateStations: [4],
        finalStation: 5,
        capturedPieceIds: [],
      },
      pendingStack: {
        arrivingPieceId: 'p1',
        targetPieceId: 'p2',
      },
    }

    render(<PlayScreen />)

    await waitFor(() => {
      expect(screen.getByText('업기!')).toBeInTheDocument()
    })
  })

  it('renders stack prompt actions during confirmingStack', () => {
    storeState = {
      ...storeState,
      phase: 'confirmingStack',
      pendingStack: {
        arrivingPieceId: 'p1',
        targetPieceId: 'p2',
      },
    }

    render(<PlayScreen />)

    expect(screen.getByText('함께 가기')).toBeInTheDocument()
    expect(screen.getByText('따로 가기')).toBeInTheDocument()
  })
})
