import { describe, expect, it, vi } from 'vitest'
import { Object3D } from 'three'
import { createResourceTracker } from '@/lib/throw3d/resourceTracker'

describe('createResourceTracker', () => {
  it('disposes tracked disposable objects exactly once', () => {
    const tracker = createResourceTracker()
    const disposable = { dispose: vi.fn() }

    tracker.track(disposable)
    tracker.dispose()

    expect(disposable.dispose).toHaveBeenCalledTimes(1)
  })

  it('removes tracked Object3D children from their parent', () => {
    const tracker = createResourceTracker()
    const parent = new Object3D()
    const child = new Object3D()

    parent.add(child)
    tracker.track(child)
    tracker.dispose()

    expect(parent.children).not.toContain(child)
  })

  it('disposes every item inside tracked arrays', () => {
    const tracker = createResourceTracker()
    const first = { dispose: vi.fn() }
    const second = { dispose: vi.fn() }

    tracker.track([first, second])
    tracker.dispose()

    expect(first.dispose).toHaveBeenCalledTimes(1)
    expect(second.dispose).toHaveBeenCalledTimes(1)
  })

  it('can dispose repeatedly without throwing', () => {
    const tracker = createResourceTracker()
    const disposable = { dispose: vi.fn() }

    tracker.track(disposable)

    expect(() => {
      tracker.dispose()
      tracker.dispose()
    }).not.toThrow()
  })
})
