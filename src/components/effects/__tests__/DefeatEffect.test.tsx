import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DefeatEffect } from '@/components/effects/DefeatEffect'

let storeState: Record<string, unknown>

vi.mock('@/store/gameStore', () => ({
  useGameStore: vi.fn((selector: (state: Record<string, unknown>) => unknown) => selector(storeState)),
}))

vi.mock('motion/react')

describe('DefeatEffect', () => {
  beforeEach(() => {
    storeState = { phase: 'defeat' }
  })

  it('activates only during defeat and settles after the brief effect window', () => {
    render(
      <DefeatEffect>
        <div>result-card</div>
      </DefeatEffect>,
    )

    expect(screen.getByTestId('defeat-effect')).toHaveAttribute('data-state', 'defeat')
  })

  it('stays inactive outside defeat', () => {
    storeState = { phase: 'victory' }

    render(
      <DefeatEffect>
        <div>result-card</div>
      </DefeatEffect>,
    )

    expect(screen.getByTestId('defeat-effect')).toHaveAttribute('data-state', 'idle')
  })

  it('unmounts cleanly without leaving defeat chrome behind', () => {
    const { unmount } = render(
      <DefeatEffect>
        <div>result-card</div>
      </DefeatEffect>,
    )

    unmount()

    expect(screen.queryByTestId('defeat-effect')).toBeNull()
  })
})
