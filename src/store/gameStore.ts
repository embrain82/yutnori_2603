'use client'

import { create } from 'zustand'
import {
  appendTurnRecord,
  applyMove,
  buildMoveCandidates,
  checkWinCondition,
  confirmStack,
  consumeMove,
  createInitialGameState,
  createSession,
  createTurnState,
  declineStack,
  finalizeSession,
  generateThrow,
  processThrow,
  selectAiCandidate,
} from '@/lib/yut'
import type {
  CouponConfig,
  GameSessionPayload,
  MoveCandidate,
  MoveRecord,
  TurnRecord,
} from '@/lib/yut'
import type { PieceState, Team, ThrowResult, TurnState } from '@/lib/yut/types'

export type GamePhase =
  | 'idle'
  | 'readyToThrow'
  | 'throwing'
  | 'selectingPiece'
  | 'animatingMove'
  | 'confirmingStack'
  | 'aiThinking'
  | 'victory'
  | 'defeat'

export type AiReaction = 'neutral' | 'excited' | 'worried' | 'smug'

export interface ValidDestination {
  stationId: number
  isBranchShortcut: boolean
  isBranchContinue: boolean
}

export interface PendingAnimation {
  pieceId: string
  fromStation: number
  intermediateStations: number[]
  finalStation: number
  capturedPieceIds: string[]
}

export interface PendingStackDecision {
  arrivingPieceId: string
  targetPieceId: string
}

interface GameStoreState {
  phase: GamePhase
  pieces: PieceState[]
  turnState: TurnState
  session: GameSessionPayload
  couponConfig: CouponConfig | null
  activeThrow: ThrowResult | null
  activeMove: ThrowResult | null
  moveCandidates: MoveCandidate[]
  selectedPieceId: string | null
  validDestinations: ValidDestination[]
  pendingAnimation: PendingAnimation | null
  pendingStack: PendingStackDecision | null
  pendingMoveRecord: MoveRecord | null
  currentTurnRecord: TurnRecord | null
  aiReaction: AiReaction
}

interface GameStoreActions {
  startGame: () => void
  restartGame: () => void
  setCouponConfig: (config: CouponConfig) => void
  startThrow: (result: ThrowResult) => void
  finishThrowReveal: () => void
  selectPiece: (pieceId: string) => void
  selectDestination: (stationId: number) => void
  resolveStack: (shouldStack: boolean) => void
  completeAnimation: () => void
  runAiTurn: () => void
}

type GameStore = GameStoreState & GameStoreActions

const emptySession: GameSessionPayload = {
  sessionId: '',
  turns: [],
  startedAt: '',
  completedAt: '',
  winner: null,
  totalTurns: 0,
}

const initialLogicState = createInitialGameState()

function createEmptyTurnRecord(team: Team): TurnRecord {
  return {
    team,
    throws: [],
    moves: [],
  }
}

export const initialState: GameStoreState = {
  phase: 'idle',
  pieces: initialLogicState.pieces,
  turnState: initialLogicState.turnState,
  session: { ...emptySession },
  couponConfig: null,
  activeThrow: null,
  activeMove: null,
  moveCandidates: [],
  selectedPieceId: null,
  validDestinations: [],
  pendingAnimation: null,
  pendingStack: null,
  pendingMoveRecord: null,
  currentTurnRecord: null,
  aiReaction: 'neutral',
}

function mapDestinations(candidates: MoveCandidate[]): ValidDestination[] {
  return candidates.map((candidate) => ({
    stationId: candidate.moveResult.newPosition.station,
    isBranchShortcut: candidate.routeChoice === 'shortcut',
    isBranchContinue: candidate.routeChoice === 'continue' && candidates.length > 1,
  }))
}

function clearMoveSelection(): Pick<
  GameStoreState,
  'activeMove' | 'moveCandidates' | 'selectedPieceId' | 'validDestinations'
> {
  return {
    activeMove: null,
    moveCandidates: [],
    selectedPieceId: null,
    validDestinations: [],
  }
}

type AutoMoveResolution =
  | { kind: 'candidate'; candidate: MoveCandidate }
  | { kind: 'piece'; pieceId: string }

function findAutoSelectablePieceId(candidates: MoveCandidate[]): string | null {
  const uniquePieceIds = Array.from(
    new Set(candidates.map((candidate) => candidate.pieceId))
  )

  if (uniquePieceIds.length !== 1) {
    return null
  }

  return uniquePieceIds[0]
}

function buildAutoMoveSignature(
  candidate: MoveCandidate,
  pieces: PieceState[]
): string {
  const movingPiece = pieces.find((piece) => piece.id === candidate.pieceId)
  if (!movingPiece) {
    return candidate.pieceId
  }

  return [
    movingPiece.position.station,
    movingPiece.position.routeId,
    movingPiece.position.routeIndex,
    candidate.routeChoice,
    candidate.moveResult.newPosition.station,
    candidate.moveResult.newPosition.routeId,
    candidate.moveResult.newPosition.routeIndex,
    candidate.moveResult.finished ? 'finish' : 'continue',
    candidate.moveResult.intermediateStations.join(','),
  ].join('|')
}

function findAutoMoveResolution(
  pieces: PieceState[],
  candidates: MoveCandidate[]
): AutoMoveResolution | null {
  const autoSelectablePieceId = findAutoSelectablePieceId(candidates)
  if (autoSelectablePieceId) {
    const pieceCandidates = candidates.filter(
      (candidate) => candidate.pieceId === autoSelectablePieceId
    )

    if (pieceCandidates.length === 1) {
      return {
        kind: 'candidate',
        candidate: pieceCandidates[0],
      }
    }

    return {
      kind: 'piece',
      pieceId: autoSelectablePieceId,
    }
  }

  const uniqueSignatures = new Set(
    candidates.map((candidate) => buildAutoMoveSignature(candidate, pieces))
  )

  if (uniqueSignatures.size === 1) {
    return {
      kind: 'candidate',
      candidate: candidates[0],
    }
  }

  return null
}

function ensureTurnRecord(record: TurnRecord | null, team: Team): TurnRecord {
  if (record && record.team === team) {
    return record
  }

  return createEmptyTurnRecord(team)
}

function hasTurnActivity(record: TurnRecord | null): boolean {
  if (!record) {
    return false
  }

  return record.throws.length > 0 || record.moves.length > 0
}

function commitTurnRecord(
  session: GameSessionPayload,
  turnRecord: TurnRecord | null
): GameSessionPayload {
  if (!hasTurnActivity(turnRecord)) {
    return session
  }

  return appendTurnRecord(session, turnRecord!)
}

function finalizeOnce(
  session: GameSessionPayload,
  winner: Team
): GameSessionPayload {
  if (session.completedAt) {
    return session
  }

  return finalizeSession(session, winner, new Date())
}

function deriveAiReaction(
  pieces: PieceState[],
  candidate: MoveCandidate,
  capturedPieceIds: string[]
): AiReaction {
  if (capturedPieceIds.length > 0 || candidate.moveResult.finished) {
    return 'excited'
  }

  const playerLeaderIsClose = pieces.some(
    (piece) =>
      piece.team === 'player' &&
      piece.stackedWith === null &&
      piece.position.station >= 15
  )

  return playerLeaderIsClose ? 'worried' : 'smug'
}

function switchTurnState(
  currentTurnState: TurnState,
  session: GameSessionPayload,
  currentTurnRecord: TurnRecord | null
): Pick<
  GameStoreState,
  | 'phase'
  | 'turnState'
  | 'session'
  | 'currentTurnRecord'
  | 'pendingMoveRecord'
  | 'activeMove'
  | 'moveCandidates'
  | 'selectedPieceId'
  | 'validDestinations'
  | 'pendingAnimation'
  | 'pendingStack'
  | 'activeThrow'
  | 'aiReaction'
> {
  const nextTeam: Team = currentTurnState.activeTeam === 'player' ? 'ai' : 'player'
  const nextTurnState = createTurnState(nextTeam)

  return {
    phase: nextTeam === 'player' ? 'readyToThrow' : 'aiThinking',
    turnState: nextTurnState,
    session: commitTurnRecord(session, currentTurnRecord),
    currentTurnRecord: createEmptyTurnRecord(nextTeam),
    pendingMoveRecord: null,
    pendingAnimation: null,
    pendingStack: null,
    activeThrow: null,
    aiReaction: 'neutral',
    ...clearMoveSelection(),
  }
}

function drainNextPlayableMove(
  pieces: PieceState[],
  turnState: TurnState
): {
  turnState: TurnState
  activeMove: ThrowResult
  moveCandidates: MoveCandidate[]
} | null {
  let currentTurnState = turnState

  // Queued yut/mo results are only consumed after all throws for the turn are finished.
  while (currentTurnState.pendingMoves.length > 0) {
    const { consumed, newTurnState } = consumeMove(currentTurnState)
    currentTurnState = newTurnState

    if (!consumed) {
      break
    }

    const candidates = buildMoveCandidates(
      pieces,
      currentTurnState.activeTeam,
      consumed
    )

    if (candidates.length > 0) {
      return {
        turnState: currentTurnState,
        activeMove: consumed,
        moveCandidates: candidates,
      }
    }
  }

  return null
}

function beginCandidateResolution(
  state: GameStoreState,
  candidate: MoveCandidate
): Partial<GameStoreState> {
  const movingPiece = state.pieces.find((piece) => piece.id === candidate.pieceId)
  if (!movingPiece) {
    return {}
  }

  const outcome = applyMove(state.pieces, candidate.pieceId, candidate.moveResult)
  const nextThrowsRemaining = outcome.capture.grantExtraThrow
    ? state.turnState.throwsRemaining + 1
    : state.turnState.throwsRemaining

  return {
    pieces: outcome.pieces,
    turnState: {
      ...state.turnState,
      throwsRemaining: nextThrowsRemaining,
    },
    pendingAnimation: {
      pieceId: candidate.pieceId,
      fromStation: movingPiece.position.station,
      intermediateStations: candidate.moveResult.intermediateStations,
      finalStation: candidate.moveResult.newPosition.station,
      capturedPieceIds: outcome.capture.capturedPieceIds,
    },
    pendingStack: outcome.stackOpportunity.canStack && outcome.stackOpportunity.targetPieceId
      ? {
          arrivingPieceId: candidate.pieceId,
          targetPieceId: outcome.stackOpportunity.targetPieceId,
        }
      : null,
    pendingMoveRecord: {
      pieceId: candidate.pieceId,
      throwName: candidate.result.name,
      steps: candidate.result.steps,
      fromStation: movingPiece.position.station,
      toStation: candidate.moveResult.newPosition.station,
      capturedPieceIds: outcome.capture.capturedPieceIds,
      stackedOnto: null,
    },
    phase: 'animatingMove',
    aiReaction: state.turnState.activeTeam === 'ai'
      ? deriveAiReaction(outcome.pieces, candidate, outcome.capture.capturedPieceIds)
      : state.aiReaction,
    ...clearMoveSelection(),
  }
}

function prepareNextPlayableState(
  state: GameStoreState,
  nextPlayable: {
    turnState: TurnState
    activeMove: ThrowResult
    moveCandidates: MoveCandidate[]
  }
): Partial<GameStoreState> {
  if (nextPlayable.turnState.activeTeam === 'ai') {
    // AI still drains the same queued move candidates as the player, but skips the tap-to-select UI.
    const aiCandidate = selectAiCandidate(
      nextPlayable.moveCandidates,
      state.pieces,
      'ai'
    )

    if (aiCandidate) {
      return {
        turnState: nextPlayable.turnState,
        activeMove: nextPlayable.activeMove,
        moveCandidates: nextPlayable.moveCandidates,
        ...beginCandidateResolution(
          {
            ...state,
            turnState: nextPlayable.turnState,
            activeMove: nextPlayable.activeMove,
            moveCandidates: nextPlayable.moveCandidates,
          },
          aiCandidate
        ),
      }
    }
  }

  const autoMoveResolution = findAutoMoveResolution(
    state.pieces,
    nextPlayable.moveCandidates
  )
  if (autoMoveResolution) {
    const preparedState = {
      ...state,
      turnState: nextPlayable.turnState,
      activeMove: nextPlayable.activeMove,
      moveCandidates: nextPlayable.moveCandidates,
    }

    if (autoMoveResolution.kind === 'candidate') {
      return {
        turnState: nextPlayable.turnState,
        activeMove: nextPlayable.activeMove,
        moveCandidates: nextPlayable.moveCandidates,
        ...beginCandidateResolution(preparedState, autoMoveResolution.candidate),
      }
    }

    const pieceCandidates = nextPlayable.moveCandidates.filter(
      (candidate) => candidate.pieceId === autoMoveResolution.pieceId
    )

    return {
      phase: 'selectingPiece',
      turnState: nextPlayable.turnState,
      pendingAnimation: null,
      pendingStack: null,
      pendingMoveRecord: null,
      activeMove: nextPlayable.activeMove,
      moveCandidates: nextPlayable.moveCandidates,
      selectedPieceId: autoMoveResolution.pieceId,
      validDestinations: mapDestinations(pieceCandidates),
    }
  }

  return {
    phase: 'selectingPiece',
    turnState: nextPlayable.turnState,
    pendingAnimation: null,
    pendingStack: null,
    pendingMoveRecord: null,
    activeMove: nextPlayable.activeMove,
    moveCandidates: nextPlayable.moveCandidates,
    selectedPieceId: null,
    validDestinations: [],
  }
}

function commitPendingMoveRecord(
  state: GameStoreState,
  stackedOnto: string | null
): Pick<GameStoreState, 'currentTurnRecord' | 'pendingMoveRecord'> {
  if (!state.pendingMoveRecord) {
    return {
      currentTurnRecord: state.currentTurnRecord,
      pendingMoveRecord: null,
    }
  }

  const turnRecord = ensureTurnRecord(state.currentTurnRecord, state.turnState.activeTeam)

  return {
    currentTurnRecord: {
      ...turnRecord,
      moves: [
        ...turnRecord.moves,
        {
          ...state.pendingMoveRecord,
          stackedOnto,
        },
      ],
    },
    pendingMoveRecord: null,
  }
}

function resolveAfterMove(state: GameStoreState): Partial<GameStoreState> {
  const winCheck = checkWinCondition(state.pieces)

  if (winCheck.isGameOver && winCheck.winner) {
    const sessionWithTurn = commitTurnRecord(state.session, state.currentTurnRecord)

    return {
      phase: winCheck.winner === 'player' ? 'victory' : 'defeat',
      session: finalizeOnce(sessionWithTurn, winCheck.winner),
      currentTurnRecord: null,
      pendingMoveRecord: null,
      pendingAnimation: null,
      pendingStack: null,
      ...clearMoveSelection(),
    }
  }

  if (state.turnState.throwsRemaining > 0) {
    return {
      phase: state.turnState.activeTeam === 'player' ? 'readyToThrow' : 'aiThinking',
      pendingAnimation: null,
      pendingStack: null,
      pendingMoveRecord: null,
      ...clearMoveSelection(),
    }
  }

  const nextPlayable = drainNextPlayableMove(state.pieces, state.turnState)
  if (nextPlayable) {
    return prepareNextPlayableState(state, nextPlayable)
  }

  return switchTurnState(state.turnState, state.session, state.currentTurnRecord)
}

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,

  startGame: () => {
    const gameState = createInitialGameState()

    set({
      ...initialState,
      pieces: gameState.pieces,
      turnState: gameState.turnState,
      session: createSession(),
      currentTurnRecord: createEmptyTurnRecord('player'),
      couponConfig: get().couponConfig,
      phase: 'readyToThrow',
    })
  },

  restartGame: () => {
    const gameState = createInitialGameState()

    set({
      ...initialState,
      pieces: gameState.pieces,
      turnState: gameState.turnState,
      couponConfig: get().couponConfig,
    })
  },

  setCouponConfig: (config) => {
    set({ couponConfig: config })
  },

  startThrow: (result) => {
    const { phase, turnState, currentTurnRecord } = get()
    if (phase !== 'readyToThrow' && phase !== 'aiThinking') {
      return
    }

    const nextTurnRecord = ensureTurnRecord(currentTurnRecord, turnState.activeTeam)

    set({
      turnState: processThrow(turnState, result),
      currentTurnRecord: {
        ...nextTurnRecord,
        throws: [...nextTurnRecord.throws, result],
      },
      activeThrow: result,
      phase: 'throwing',
      pendingAnimation: null,
      pendingStack: null,
      pendingMoveRecord: null,
      ...clearMoveSelection(),
    })
  },

  finishThrowReveal: () => {
    const current = get()

    if (current.phase !== 'throwing') {
      return
    }

    const baseState: Partial<GameStoreState> = {
      activeThrow: null,
      pendingAnimation: null,
      pendingStack: null,
      pendingMoveRecord: null,
      ...clearMoveSelection(),
    }

    if (current.turnState.throwsRemaining > 0) {
      set({
        ...baseState,
        phase: current.turnState.activeTeam === 'player' ? 'readyToThrow' : 'aiThinking',
      })
      return
    }

    const nextPlayable = drainNextPlayableMove(current.pieces, current.turnState)
    if (nextPlayable) {
      set({
        ...baseState,
        ...prepareNextPlayableState(
          {
            ...current,
            ...baseState,
          },
          nextPlayable
        ),
      })
      return
    }

    set({
      ...baseState,
      ...switchTurnState(current.turnState, current.session, current.currentTurnRecord),
    })
  },

  selectPiece: (pieceId) => {
    const current = get()
    const { phase, moveCandidates } = current
    if (phase !== 'selectingPiece') {
      return
    }

    const pieceCandidates = moveCandidates.filter((candidate) => candidate.pieceId === pieceId)
    if (pieceCandidates.length === 0) {
      return
    }

    if (pieceCandidates.length === 1) {
      set(beginCandidateResolution(current, pieceCandidates[0]))
      return
    }

    set({
      selectedPieceId: pieceId,
      validDestinations: mapDestinations(pieceCandidates),
    })
  },

  selectDestination: (stationId) => {
    const current = get()
    if (current.phase !== 'selectingPiece' || current.selectedPieceId === null) {
      return
    }

    const candidate = current.moveCandidates.find(
      (item) =>
        item.pieceId === current.selectedPieceId &&
        item.moveResult.newPosition.station === stationId
    )

    if (!candidate) {
      return
    }

    set(beginCandidateResolution(current, candidate))
  },

  resolveStack: (shouldStack) => {
    const current = get()
    if (current.phase !== 'confirmingStack' || current.pendingStack === null) {
      return
    }

    const pieces = shouldStack
      ? confirmStack(
          current.pieces,
          current.pendingStack.arrivingPieceId,
          current.pendingStack.targetPieceId
        )
      : current.pieces

    if (!shouldStack) {
      declineStack()
    }

    const moveRecordState = commitPendingMoveRecord(
      current,
      shouldStack ? current.pendingStack.targetPieceId : null
    )

    set((state) => ({
      ...state,
      pieces,
      pendingStack: null,
      pendingAnimation: null,
      ...moveRecordState,
      ...resolveAfterMove({
        ...state,
        pieces,
        pendingStack: null,
        pendingAnimation: null,
        ...moveRecordState,
      }),
    }))
  },

  completeAnimation: () => {
    const current = get()
    if (current.phase !== 'animatingMove') {
      return
    }

    if (current.pendingStack !== null) {
      if (current.turnState.activeTeam === 'ai') {
        const pieces = confirmStack(
          current.pieces,
          current.pendingStack.arrivingPieceId,
          current.pendingStack.targetPieceId
        )
        const moveRecordState = commitPendingMoveRecord(
          current,
          current.pendingStack.targetPieceId
        )

        set((state) => ({
          ...state,
          pieces,
          pendingStack: null,
          pendingAnimation: null,
          ...moveRecordState,
          ...resolveAfterMove({
            ...state,
            pieces,
            pendingStack: null,
            pendingAnimation: null,
            ...moveRecordState,
          }),
        }))
        return
      }

      set({
        phase: 'confirmingStack',
        pendingAnimation: null,
      })
      return
    }

    const moveRecordState = commitPendingMoveRecord(current, null)

    set((state) => ({
      ...state,
      ...moveRecordState,
      ...resolveAfterMove({
        ...state,
        pendingAnimation: null,
        ...moveRecordState,
      }),
    }))
  },

  runAiTurn: () => {
    const current = get()
    if (current.phase !== 'aiThinking' || current.turnState.activeTeam !== 'ai') {
      return
    }

    get().startThrow(generateThrow())
  },
}))
