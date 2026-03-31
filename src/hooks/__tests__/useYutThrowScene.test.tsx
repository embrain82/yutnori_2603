import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createYutThrowScene } from '@/lib/throw3d/createYutThrowScene'
import { useYutThrowScene } from '@/hooks/useYutThrowScene'
import type { ThrowResult } from '@/lib/yut/types'

const mockStartThrow = vi.fn<(_: ThrowResult) => Promise<void>>()
const mockResize = vi.fn()
const mockDispose = vi.fn()

let capturedPhaseChange: ((phase: 'idle' | 'launching' | 'settling' | 'revealing' | 'disposed') => void) | undefined
let capturedReveal: ((result: ThrowResult) => void) | undefined

vi.mock('@/lib/throw3d/createYutThrowScene', () => ({
  createYutThrowScene: vi.fn(),
}))

describe('useYutThrowScene', () => {
  beforeEach(() => {
    capturedPhaseChange = undefined
    capturedReveal = undefined
    vi.mocked(createYutThrowScene).mockReset()
    mockStartThrow.mockReset()
    mockResize.mockReset()
    mockDispose.mockReset()
    mockStartThrow.mockResolvedValue(undefined)

    vi.mocked(createYutThrowScene).mockImplementation((params) => {
      capturedPhaseChange = params.onPhaseChange
      capturedReveal = params.onReveal

      return {
        startThrow: mockStartThrow,
        resize: mockResize,
        dispose: mockDispose,
      }
    })
  })

  it('creates the controller once when a canvas ref becomes available', () => {
    const { result, rerender } = renderHook(() => useYutThrowScene())

    act(() => {
      result.current.canvasRef.current = document.createElement('canvas')
    })

    rerender()

    expect(createYutThrowScene).toHaveBeenCalledTimes(1)
  })

  it('forwards throwOnce results into startThrow', async () => {
    const { result, rerender } = renderHook(() => useYutThrowScene())
    const throwResult: ThrowResult = { name: 'gae', steps: 2, grantsExtra: false }

    act(() => {
      result.current.canvasRef.current = document.createElement('canvas')
    })

    rerender()

    await act(async () => {
      await result.current.throwOnce(throwResult)
    })

    expect(mockStartThrow).toHaveBeenCalledWith(throwResult)
  })

  it('updates phase state from onPhaseChange', () => {
    const { result, rerender } = renderHook(() => useYutThrowScene())

    act(() => {
      result.current.canvasRef.current = document.createElement('canvas')
    })

    rerender()

    act(() => {
      capturedPhaseChange?.('settling')
    })

    expect(result.current.phase).toBe('settling')
  })

  it('stores the revealed result from onReveal', () => {
    const { result, rerender } = renderHook(() => useYutThrowScene())
    const throwResult: ThrowResult = { name: 'yut', steps: 4, grantsExtra: true }

    act(() => {
      result.current.canvasRef.current = document.createElement('canvas')
    })

    rerender()

    act(() => {
      capturedReveal?.(throwResult)
    })

    expect(result.current.revealedResult?.name).toBe('yut')
  })

  it('disposes the controller on unmount', () => {
    const { result, rerender, unmount } = renderHook(() => useYutThrowScene())

    act(() => {
      result.current.canvasRef.current = document.createElement('canvas')
    })

    rerender()
    unmount()

    expect(mockDispose).toHaveBeenCalledTimes(1)
  })
})
