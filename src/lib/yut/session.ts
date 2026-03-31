import type { Team, ThrowName, ThrowResult } from '@/lib/yut/types'

export interface MoveRecord {
  pieceId: string
  throwName: ThrowName
  steps: number
  fromStation: number
  toStation: number
  capturedPieceIds: string[]
  stackedOnto: string | null
}

export interface TurnRecord {
  team: Team
  throws: ThrowResult[]
  moves: MoveRecord[]
}

export interface GameSessionPayload {
  sessionId: string
  turns: TurnRecord[]
  startedAt: string
  completedAt: string
  winner: Team | null
  totalTurns: number
}

export interface CouponConfig {
  couponCode: string
  couponImage?: string
  couponText?: string
}

export interface YutCouponConfigMessage {
  type: 'YUT_COUPON_CONFIG'
  couponCode: string
  couponImage?: string
  couponText?: string
}

export interface YutGameStartMessage {
  type: 'YUT_GAME_START'
  payload: {
    sessionId: string
    startedAt: string
  }
}

export interface YutGameEndMessage {
  type: 'YUT_GAME_END'
  payload: {
    sessionId: string
    completedAt: string
    winner: Team | null
  }
}

export interface YutGameWinMessage {
  type: 'YUT_GAME_WIN'
  payload: GameSessionPayload
}

export function createSession(): GameSessionPayload {
  return {
    sessionId: crypto.randomUUID(),
    turns: [],
    startedAt: new Date().toISOString(),
    completedAt: '',
    winner: null,
    totalTurns: 0,
  }
}

export function appendTurnRecord(
  session: GameSessionPayload,
  turn: TurnRecord
): GameSessionPayload {
  return {
    ...session,
    turns: [...session.turns, turn],
    totalTurns: session.totalTurns + 1,
  }
}

export function finalizeSession(
  session: GameSessionPayload,
  winner: Team,
  endTime: Date
): GameSessionPayload {
  return {
    ...session,
    completedAt: endTime.toISOString(),
    winner,
  }
}
