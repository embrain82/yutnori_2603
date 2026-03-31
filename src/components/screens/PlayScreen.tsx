'use client'

import { useEffect, useRef } from 'react'
import { Board } from '@/components/board/Board'
import { HomeZone } from '@/components/board/HomeZone'
import { PieceToken } from '@/components/board/PieceToken'
import { AiReactionBubble } from '@/components/game/AiReactionBubble'
import { TurnBanner } from '@/components/game/TurnBanner'
import { RESULT_LABELS } from '@/components/throw/ThrowResultCard'
import { YutThrowOverlay } from '@/components/throw/YutThrowOverlay'
import { shakeBoard, useHopAnimation } from '@/hooks/useHopAnimation'
import { BOARD_VIEWBOX, STATION_COORDS } from '@/lib/yut/boardCoords'
import { generateThrow } from '@/lib/yut/throw'
import { HOME } from '@/lib/yut/types'
import { useGameStore } from '@/store/gameStore'

const ENTRY_STATION = 0

export function PlayScreen(): React.JSX.Element {
  const phase = useGameStore((state) => state.phase)
  const pieces = useGameStore((state) => state.pieces)
  const turnState = useGameStore((state) => state.turnState)
  const selectedPieceId = useGameStore((state) => state.selectedPieceId)
  const validDestinations = useGameStore((state) => state.validDestinations)
  const activeThrow = useGameStore((state) => state.activeThrow)
  const activeMove = useGameStore((state) => state.activeMove)
  const moveCandidates = useGameStore((state) => state.moveCandidates)
  const pendingAnimation = useGameStore((state) => state.pendingAnimation)
  const pendingStack = useGameStore((state) => state.pendingStack)
  const aiReaction = useGameStore((state) => state.aiReaction)
  const startThrow = useGameStore((state) => state.startThrow)
  const finishThrowReveal = useGameStore((state) => state.finishThrowReveal)
  const selectPiece = useGameStore((state) => state.selectPiece)
  const selectDestination = useGameStore((state) => state.selectDestination)
  const resolveStack = useGameStore((state) => state.resolveStack)
  const completeAnimation = useGameStore((state) => state.completeAnimation)
  const { scope, isAnimating, startHop } = useHopAnimation()
  const boardFrameRef = useRef<HTMLDivElement | null>(null)

  const playerHomePieces = pieces
    .filter((piece) => piece.team === 'player' && piece.position.station === HOME)
    .map((piece) => ({
      id: piece.id,
      team: piece.team,
      stackCount: 1 + piece.stackedPieceIds.length,
    }))

  const aiHomePieces = pieces
    .filter((piece) => piece.team === 'ai' && piece.position.station === HOME)
    .map((piece) => ({
      id: piece.id,
      team: piece.team,
      stackCount: 1 + piece.stackedPieceIds.length,
    }))

  // Both the board and HOME zones read from the same current move-candidate list.
  const selectablePieceIds = Array.from(new Set(moveCandidates.map((candidate) => candidate.pieceId)))

  const movingPiece = pendingAnimation
    ? pieces.find((piece) => piece.id === pendingAnimation.pieceId) ?? null
    : null
  const startStation = pendingAnimation
    ? pendingAnimation.fromStation >= 0
      ? pendingAnimation.fromStation
      : ENTRY_STATION
    : null
  const startCoord = startStation !== null ? STATION_COORDS[startStation] : null
  const queuedResults = [
    ...(activeMove ? [activeMove] : []),
    ...turnState.pendingMoves,
  ]

  useEffect(() => {
    if (phase !== 'animatingMove' || !pendingAnimation) {
      return
    }

    let cancelled = false

    void (async () => {
      if (pendingAnimation.capturedPieceIds.length > 0) {
        shakeBoard(boardFrameRef)
      }

      if (pendingAnimation.finalStation >= 0) {
        await startHop(
          pendingAnimation.intermediateStations,
          pendingAnimation.finalStation
        )
      }

      if (!cancelled) {
        completeAnimation()
      }
    })()

    return () => {
      cancelled = true
    }
  }, [completeAnimation, pendingAnimation, phase, startHop])

  return (
    <main className="min-h-dvh bg-[linear-gradient(180deg,#fff8ee_0%,#f7e4bf_55%,#efc98e_100%)] px-4 py-6">
      <section className="mx-auto flex max-w-3xl flex-col gap-4 rounded-[32px] bg-white/76 px-4 py-5 text-[#1A1A2E] shadow-[0_30px_90px_rgba(120,75,24,0.16)] backdrop-blur-md">
        <TurnBanner
          activeTeam={turnState.activeTeam}
          throwsRemaining={turnState.throwsRemaining}
        />

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#A06A2A]">
            Queue
          </span>
          {queuedResults.length > 0 ? (
            queuedResults.map((result, index) => (
              <span
                key={`${result.name}-${index}`}
                className="rounded-full bg-[#FFF4DA] px-3 py-1 text-sm font-semibold text-[#6E4B21]"
              >
                {RESULT_LABELS[result.name]}
              </span>
            ))
          ) : (
            <span className="text-sm text-[#7A5A32]">대기 중인 윷 없음</span>
          )}
        </div>

        <HomeZone
          playerHomePieces={playerHomePieces}
          aiHomePieces={aiHomePieces}
          selectablePieceIds={selectablePieceIds}
          selectedPieceId={selectedPieceId}
          onPieceSelect={selectPiece}
        />

        <div ref={boardFrameRef} className="relative mx-auto w-full max-w-[500px]">
          <div className="absolute right-3 top-3 z-30">
            <AiReactionBubble
              reaction={aiReaction}
              thinking={phase === 'aiThinking'}
            />
          </div>

          <Board
            pieces={pieces}
            selectedPieceId={selectedPieceId}
            validDestinations={validDestinations}
            isAnimating={isAnimating || phase === 'animatingMove'}
            animatingPieceId={pendingAnimation?.pieceId ?? null}
            animatingPosition={null}
            onPieceSelect={selectPiece}
            onDestinationSelect={selectDestination}
          />

          {pendingAnimation && movingPiece && startCoord ? (
            <svg
              viewBox={BOARD_VIEWBOX}
              className="pointer-events-none absolute inset-0 w-full max-w-[500px] aspect-square"
            >
              <g ref={scope} transform={`translate(${startCoord.x} ${startCoord.y})`}>
                <PieceToken
                  cx={0}
                  cy={0}
                  team={movingPiece.team}
                  stackCount={1 + movingPiece.stackedPieceIds.length}
                  isSelectable={false}
                  isSelected={false}
                  onSelect={() => {}}
                />
              </g>
            </svg>
          ) : null}

          <YutThrowOverlay
            open={phase === 'throwing'}
            result={activeThrow}
            onComplete={finishThrowReveal}
          />
        </div>

        {phase === 'readyToThrow' && turnState.activeTeam === 'player' ? (
          <button
            type="button"
            onClick={() => startThrow(generateThrow())}
            className="min-h-11 rounded-full bg-[#1A1A2E] px-6 text-white disabled:opacity-50"
          >
            윷 던지기
          </button>
        ) : null}

        {phase === 'confirmingStack' && pendingStack ? (
          <div className="rounded-[28px] bg-[#FFF7E2] px-4 py-4 shadow-[0_16px_36px_rgba(120,75,24,0.12)]">
            <p className="text-sm font-medium text-[#6E4B21]">
              같은 팀 말과 만났어요. 함께 이동할까요?
            </p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => resolveStack(true)}
                className="min-h-11 rounded-full bg-[#1A1A2E] px-5 text-white"
              >
                함께 가기
              </button>
              <button
                type="button"
                onClick={() => resolveStack(false)}
                className="min-h-11 rounded-full bg-white px-5 text-[#1A1A2E]"
              >
                따로 가기
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </main>
  )
}
