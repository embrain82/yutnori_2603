import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useHopAnimation, shakeBoard } from '@/hooks/useHopAnimation'

// Mock useAnimate from motion/react
const mockAnimate = vi.fn().mockResolvedValue(undefined)
const mockScope = { current: document.createElementNS('http://www.w3.org/2000/svg', 'g') }

vi.mock('motion/react', () => ({
  useAnimate: () => [mockScope, mockAnimate],
  motion: new Proxy(
    {},
    {
      get(_target: unknown, prop: string) {
        return prop
      },
    },
  ),
}))

describe('useHopAnimation', () => {
  beforeEach(() => {
    mockAnimate.mockClear()
    mockAnimate.mockResolvedValue(undefined)
  })

  it('startHop calls animate for each intermediate station with 200ms duration', async () => {
    const { result } = renderHook(() => useHopAnimation())

    await act(async () => {
      await result.current.startHop([3, 4], 5)
    })

    // 2 intermediate hops + 1 final = 3 calls
    const intermediateCalls = mockAnimate.mock.calls.filter(
      (call) => call[2]?.duration === 0.2,
    )
    expect(intermediateCalls).toHaveLength(2)

    // Verify ease-out cubic bezier for intermediate hops
    for (const call of intermediateCalls) {
      expect(call[2].ease).toEqual([0.25, 0.1, 0.25, 1])
    }
  })

  it('startHop calls animate for final station with spring transition', async () => {
    const { result } = renderHook(() => useHopAnimation())

    await act(async () => {
      await result.current.startHop([3, 4], 5)
    })

    // Last call should use spring transition
    const lastCall = mockAnimate.mock.calls[mockAnimate.mock.calls.length - 1]
    expect(lastCall[2]).toEqual(
      expect.objectContaining({
        type: 'spring',
        stiffness: 400,
        damping: 20,
      }),
    )
  })

  it('isAnimating is true during animation and false after completion', async () => {
    // Control resolution timing
    let resolveAnimate!: () => void
    mockAnimate.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveAnimate = resolve
        }),
    )

    const { result } = renderHook(() => useHopAnimation())

    expect(result.current.isAnimating).toBe(false)

    let hopPromise: Promise<void>
    act(() => {
      hopPromise = result.current.startHop([], 5)
    })

    // isAnimating should be true now
    expect(result.current.isAnimating).toBe(true)

    // Resolve the final animate call
    await act(async () => {
      resolveAnimate()
      await hopPromise!
    })

    expect(result.current.isAnimating).toBe(false)
  })

  it('startHop resolves promise after animation completes', async () => {
    const { result } = renderHook(() => useHopAnimation())

    const onComplete = vi.fn()

    await act(async () => {
      await result.current.startHop([3], 5)
      onComplete()
    })

    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('animateCapture moves piece to HOME coordinates', async () => {
    const { result } = renderHook(() => useHopAnimation())

    await act(async () => {
      await result.current.animateCapture(40, 250)
    })

    // Should call animate with target coordinates and capture spring
    const captureCall = mockAnimate.mock.calls[0]
    expect(captureCall[1]).toEqual(
      expect.objectContaining({ x: 40, y: 250 }),
    )
    expect(captureCall[2]).toEqual(
      expect.objectContaining({
        type: 'spring',
        stiffness: 300,
        damping: 25,
      }),
    )
  })
})

describe('shakeBoard', () => {
  it('applies translateX keyframes to container ref', () => {
    const mockContainerAnimate = vi.fn()
    const containerRef = {
      current: { animate: mockContainerAnimate } as unknown as HTMLDivElement,
    }

    shakeBoard(containerRef)

    expect(mockContainerAnimate).toHaveBeenCalledTimes(1)

    const [keyframes, options] = mockContainerAnimate.mock.calls[0]

    // Verify translateX keyframes: [0, -4, 4, -2, 2, 0]
    expect(keyframes).toEqual([
      { transform: 'translateX(0px)' },
      { transform: 'translateX(-4px)' },
      { transform: 'translateX(4px)' },
      { transform: 'translateX(-2px)' },
      { transform: 'translateX(2px)' },
      { transform: 'translateX(0px)' },
    ])

    expect(options.duration).toBe(300)
  })
})
