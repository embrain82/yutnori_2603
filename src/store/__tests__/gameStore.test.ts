import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { FINISH, createSession, createTurnState } from '@/lib/yut'
import { useGameStore, initialState } from '@/store/gameStore'
import type { CouponConfig } from '@/lib/yut'
import type { PieceState, ThrowResult } from '@/lib/yut/types'

function resetStore() {
  useGameStore.setState({
    ...initialState,
  })
}

function makeThrow(name: ThrowResult['name'], steps: number, grantsExtra: boolean): ThrowResult {
  return { name, steps, grantsExtra }
}

function makePiece(
  id: string,
  team: PieceState['team'],
  station: number,
  routeId: string = '',
  routeIndex: number = -1
): PieceState {
  return {
    id,
    team,
    position: { station, routeId, routeIndex },
    stackedPieceIds: [],
    stackedWith: null,
  }
}

describe('gameStore', () => {
  beforeEach(() => {
    resetStore()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('startGame enters readyToThrow with a new player session', () => {
    useGameStore.getState().startGame()
    const state = useGameStore.getState()

    expect(state.phase).toBe('readyToThrow')
    expect(state.turnState.activeTeam).toBe('player')
    expect(state.session.sessionId).not.toBe('')
    expect(state.session.startedAt).not.toBe('')
  })

  it('startThrow stores activeThrow and updates the pending queue', () => {
    useGameStore.getState().startGame()
    useGameStore.getState().startThrow(makeThrow('yut', 4, true))
    const state = useGameStore.getState()

    expect(state.phase).toBe('throwing')
    expect(state.activeThrow?.name).toBe('yut')
    expect(state.turnState.pendingMoves).toEqual([makeThrow('yut', 4, true)])
    expect(state.turnState.throwsRemaining).toBe(1)
  })

  it('finishThrowReveal enters selectingPiece with a playable move after a non-extra throw', () => {
    useGameStore.getState().startGame()
    useGameStore.getState().startThrow(makeThrow('do', 1, false))
    useGameStore.getState().finishThrowReveal()
    const state = useGameStore.getState()

    expect(state.phase).toBe('selectingPiece')
    expect(state.activeMove?.name).toBe('do')
    expect(state.moveCandidates.length).toBeGreaterThan(0)
  })

  it('selectPiece exposes valid destinations for the chosen piece', () => {
    useGameStore.getState().startGame()
    useGameStore.getState().startThrow(makeThrow('do', 1, false))
    useGameStore.getState().finishThrowReveal()
    useGameStore.getState().selectPiece('p1')
    const state = useGameStore.getState()

    expect(state.selectedPieceId).toBe('p1')
    expect(state.validDestinations).toEqual([
      {
        stationId: 1,
        isBranchShortcut: false,
        isBranchContinue: false,
      },
    ])
  })

  it('selectDestination enters animatingMove with pending animation data', () => {
    useGameStore.getState().startGame()
    useGameStore.getState().startThrow(makeThrow('do', 1, false))
    useGameStore.getState().finishThrowReveal()
    useGameStore.getState().selectPiece('p1')
    useGameStore.getState().selectDestination(1)
    const state = useGameStore.getState()

    expect(state.phase).toBe('animatingMove')
    expect(state.pendingAnimation).toEqual({
      pieceId: 'p1',
      fromStation: -1,
      intermediateStations: [],
      finalStation: 1,
      capturedPieceIds: [],
    })
  })

  it('completeAnimation hands the turn to AI when no work remains', () => {
    useGameStore.getState().startGame()
    useGameStore.getState().startThrow(makeThrow('do', 1, false))
    useGameStore.getState().finishThrowReveal()
    useGameStore.getState().selectPiece('p1')
    useGameStore.getState().selectDestination(1)
    useGameStore.getState().completeAnimation()
    const state = useGameStore.getState()

    expect(state.phase).toBe('aiThinking')
    expect(state.turnState.activeTeam).toBe('ai')
  })

  it('restartGame resets gameplay while preserving couponConfig', () => {
    const couponConfig: CouponConfig = { couponCode: 'KEEP-ME' }
    useGameStore.getState().setCouponConfig(couponConfig)
    useGameStore.getState().startGame()
    useGameStore.getState().restartGame()
    const state = useGameStore.getState()

    expect(state.phase).toBe('idle')
    expect(state.couponConfig).toEqual(couponConfig)
    expect(state.activeThrow).toBeNull()
    expect(state.activeMove).toBeNull()
  })

  it('runAiTurn starts a throw from aiThinking', () => {
    useGameStore.setState({
      ...initialState,
      phase: 'aiThinking',
      turnState: createTurnState('ai'),
      session: createSession(),
    })

    useGameStore.getState().runAiTurn()
    const state = useGameStore.getState()

    expect(state.phase).toBe('throwing')
    expect(state.turnState.activeTeam).toBe('ai')
    expect(state.activeThrow).not.toBeNull()
  })

  it('finishThrowReveal auto-selects an AI candidate instead of waiting for manual input', () => {
    const randomSpy = vi.spyOn(Math, 'random')
    randomSpy.mockReturnValue(0.9)

    useGameStore.setState({
      ...initialState,
      phase: 'throwing',
      pieces: [
        makePiece('p1', 'player', -1),
        makePiece('p2', 'player', -1),
        makePiece('ai1', 'ai', -1),
        makePiece('ai2', 'ai', FINISH),
      ],
      turnState: {
        activeTeam: 'ai',
        throwsRemaining: 0,
        pendingMoves: [makeThrow('do', 1, false)],
      },
      activeThrow: makeThrow('do', 1, false),
      session: createSession(),
    })

    useGameStore.getState().finishThrowReveal()
    const state = useGameStore.getState()

    expect(state.phase).toBe('animatingMove')
    expect(state.pendingAnimation).toEqual({
      pieceId: 'ai1',
      fromStation: -1,
      intermediateStations: [],
      finalStation: 1,
      capturedPieceIds: [],
    })
  })

  it('completeAnimation returns control to the player after the AI finishes its queued work', () => {
    useGameStore.setState({
      ...initialState,
      phase: 'animatingMove',
      pieces: [
        makePiece('p1', 'player', -1),
        makePiece('p2', 'player', -1),
        makePiece('ai1', 'ai', 1, 'outer', 1),
        makePiece('ai2', 'ai', -1),
      ],
      turnState: {
        activeTeam: 'ai',
        throwsRemaining: 0,
        pendingMoves: [],
      },
      pendingAnimation: {
        pieceId: 'ai1',
        fromStation: -1,
        intermediateStations: [],
        finalStation: 1,
        capturedPieceIds: [],
      },
      session: createSession(),
    })

    useGameStore.getState().completeAnimation()
    const state = useGameStore.getState()

    expect(state.phase).toBe('readyToThrow')
    expect(state.turnState.activeTeam).toBe('player')
    expect(state.aiReaction).toBe('neutral')
  })

  it('finalizes the session when the player finishes both pieces', () => {
    const session = createSession()

    useGameStore.setState({
      ...initialState,
      phase: 'animatingMove',
      pieces: [
        makePiece('p1', 'player', FINISH),
        makePiece('p2', 'player', FINISH),
        makePiece('ai1', 'ai', -1),
        makePiece('ai2', 'ai', -1),
      ],
      turnState: {
        activeTeam: 'player',
        throwsRemaining: 0,
        pendingMoves: [],
      },
      pendingAnimation: {
        pieceId: 'p2',
        fromStation: 19,
        intermediateStations: [],
        finalStation: FINISH,
        capturedPieceIds: [],
      },
      session,
    })

    useGameStore.getState().completeAnimation()
    const state = useGameStore.getState()

    expect(state.phase).toBe('victory')
    expect(state.session.winner).toBe('player')
    expect(state.session.completedAt).not.toBe('')
  })

  it('sets aiReaction to excited when the AI captures a player piece', () => {
    const randomSpy = vi.spyOn(Math, 'random')
    randomSpy.mockReturnValue(0.9)

    useGameStore.setState({
      ...initialState,
      phase: 'throwing',
      pieces: [
        makePiece('p1', 'player', 5, 'outer', 5),
        makePiece('p2', 'player', -1),
        makePiece('ai1', 'ai', 3, 'outer', 3),
        makePiece('ai2', 'ai', FINISH),
      ],
      turnState: {
        activeTeam: 'ai',
        throwsRemaining: 0,
        pendingMoves: [makeThrow('gae', 2, false)],
      },
      activeThrow: makeThrow('gae', 2, false),
      session: createSession(),
    })

    useGameStore.getState().finishThrowReveal()

    expect(useGameStore.getState().aiReaction).toBe('excited')
  })

  it('sets aiReaction to worried when the player is one stretch away from winning', () => {
    useGameStore.setState({
      ...initialState,
      phase: 'throwing',
      pieces: [
        makePiece('p1', 'player', 15, 'outer', 15),
        makePiece('p2', 'player', -1),
        makePiece('ai1', 'ai', -1),
        makePiece('ai2', 'ai', FINISH),
      ],
      turnState: {
        activeTeam: 'ai',
        throwsRemaining: 0,
        pendingMoves: [makeThrow('do', 1, false)],
      },
      activeThrow: makeThrow('do', 1, false),
      session: createSession(),
    })

    useGameStore.getState().finishThrowReveal()

    expect(useGameStore.getState().aiReaction).toBe('worried')
  })

  it('sets aiReaction to smug for a routine AI move with no pressure', () => {
    useGameStore.setState({
      ...initialState,
      phase: 'throwing',
      pieces: [
        makePiece('p1', 'player', 4, 'outer', 4),
        makePiece('p2', 'player', -1),
        makePiece('ai1', 'ai', -1),
        makePiece('ai2', 'ai', FINISH),
      ],
      turnState: {
        activeTeam: 'ai',
        throwsRemaining: 0,
        pendingMoves: [makeThrow('do', 1, false)],
      },
      activeThrow: makeThrow('do', 1, false),
      session: createSession(),
    })

    useGameStore.getState().finishThrowReveal()

    expect(useGameStore.getState().aiReaction).toBe('smug')
  })
})
