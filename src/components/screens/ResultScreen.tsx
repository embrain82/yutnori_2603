'use client'

import { useGameStore } from '@/store/gameStore'

export function ResultScreen(): React.JSX.Element {
  const phase = useGameStore((state) => state.phase)
  const couponConfig = useGameStore((state) => state.couponConfig)
  const restartGame = useGameStore((state) => state.restartGame)

  const isVictory = phase === 'victory'
  const bannerCopy = isVictory ? '승리 보너스' : '다시 도전'
  const eyebrowCopy = isVictory ? 'YUT NORI WIN' : 'NEXT ROUND'
  const supportCopy = isVictory
    ? '승리 기념 선물이 도착했어요.'
    : '거의 따라잡았어요. 한 번만 더 던지면 흐름을 바꿀 수 있어요.'

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[linear-gradient(180deg,#fff8ee_0%,#f7e4bf_55%,#efc98e_100%)] px-4 py-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.72)_0%,rgba(255,255,255,0)_54%)]" />
      <section className="relative mx-auto flex w-full max-w-xl flex-col items-center gap-6 overflow-hidden rounded-[34px] border border-white/65 bg-white/86 px-6 py-8 text-center text-[#1A1A2E] shadow-[0_30px_90px_rgba(120,75,24,0.16)] backdrop-blur-md">
        <div
          aria-hidden="true"
          className={[
            'absolute inset-x-8 top-0 h-28 rounded-b-[34px] opacity-75',
            isVictory
              ? 'bg-[linear-gradient(180deg,rgba(255,225,138,0.85)_0%,rgba(255,225,138,0)_100%)]'
              : 'bg-[linear-gradient(180deg,rgba(255,204,185,0.85)_0%,rgba(255,204,185,0)_100%)]',
          ].join(' ')}
        />

        <div className="relative flex flex-col items-center gap-4">
          <p
            className={[
              'rounded-full px-4 py-1 text-xs font-semibold tracking-[0.24em]',
              isVictory
                ? 'bg-[#FFE7A2] text-[#8E6500]'
                : 'bg-[#FFE3DA] text-[#B24A36]',
            ].join(' ')}
          >
            {bannerCopy}
          </p>

          <div className="space-y-3">
            <p className="text-xs font-semibold tracking-[0.3em] text-[#8D6E63]">
              {eyebrowCopy}
            </p>
            <h1
              className={[
                'text-4xl font-bold tracking-tight',
                isVictory ? 'text-[#B8860B]' : 'text-[#D54B4B]',
              ].join(' ')}
            >
              {isVictory ? '축하합니다!' : '아쉽네요...'}
            </h1>
            <p className="max-w-md text-sm leading-6 text-[#5C442A]">
              {supportCopy}
            </p>
          </div>
        </div>

        {isVictory ? (
          <div
            data-testid="coupon-area"
            className="relative flex w-full flex-col items-center gap-3 rounded-[28px] border border-[#E7C777] bg-[linear-gradient(180deg,#fff9ea_0%,#fff2d2_100%)] px-5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]"
          >
            <p className="text-[11px] font-semibold tracking-[0.24em] text-[#8D6E63]">
              COUPON GIFT
            </p>
            {couponConfig?.couponImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={couponConfig.couponImage}
                alt="쿠폰"
                className="w-full max-w-[280px] rounded-2xl"
              />
            ) : null}
            {couponConfig?.couponCode ? (
              <p className="rounded-2xl bg-[#1A1A2E]/8 px-5 py-3 font-mono text-2xl font-bold tracking-[0.12em] text-[#1A1A2E]">
                {couponConfig.couponCode}
              </p>
            ) : null}
            {couponConfig?.couponText ? (
              <p className="text-sm text-[#5C442A]">{couponConfig.couponText}</p>
            ) : (
              <p className="text-sm text-[#5C442A]">쿠폰은 이벤트 페이지에서 확인하세요</p>
            )}
          </div>
        ) : (
          <div className="w-full rounded-[28px] border border-[#F2D0C0] bg-[linear-gradient(180deg,#fff8f3_0%,#fff1ea_100%)] px-5 py-5 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]">
            <p className="text-sm font-semibold text-[#8A5B2D]">
              다음 판에서는 HOME에서부터 다시 차근차근 올라갈 수 있어요.
            </p>
            <p className="mt-2 text-sm leading-6 text-[#7B5B49]">
              지금 바로 다시 시작하면 던지기부터 자연스럽게 이어집니다.
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={restartGame}
          className="min-h-11 rounded-full bg-[#1A1A2E] px-8 py-3 text-base font-semibold text-white shadow-[0_12px_24px_rgba(26,26,46,0.22)]"
        >
          {isVictory ? '한 번 더 하기' : '다시 도전'}
        </button>
      </section>
    </main>
  )
}
