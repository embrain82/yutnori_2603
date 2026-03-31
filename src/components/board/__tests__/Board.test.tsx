import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Board } from '@/components/board/Board'

describe('Board', () => {
  it('renders SVG with viewBox 0 0 500 500', () => {
    const { container } = render(<Board />)
    const svg = container.querySelector('svg')
    expect(svg).not.toBeNull()
    expect(svg!.getAttribute('viewBox')).toBe('0 0 500 500')
  })

  it('renders exactly 29 station circles', () => {
    const { container } = render(<Board />)
    const stations = container.querySelectorAll('[data-station-id]')
    expect(stations).toHaveLength(29)
  })

  it('corner stations (0,5,10,15) have r=10', () => {
    const { container } = render(<Board />)
    const cornerIds = [0, 5, 10, 15]
    for (const id of cornerIds) {
      const station = container.querySelector(`[data-station-id="${id}"]`)
      expect(station).not.toBeNull()
      expect(station!.getAttribute('r')).toBe('10')
    }
  })

  it('center station (22) has r=10', () => {
    const { container } = render(<Board />)
    const center = container.querySelector('[data-station-id="22"]')
    expect(center).not.toBeNull()
    expect(center!.getAttribute('r')).toBe('10')
  })

  it('normal stations have r=6', () => {
    const { container } = render(<Board />)
    const station3 = container.querySelector('[data-station-id="3"]')
    expect(station3).not.toBeNull()
    expect(station3!.getAttribute('r')).toBe('6')
  })

  it('has aria-label for accessibility', () => {
    const { container } = render(<Board />)
    const svg = container.querySelector('svg')
    expect(svg).not.toBeNull()
    expect(svg!.getAttribute('aria-label')).toBe('윷놀이 게임판')
  })

  it('BoardBackground renders diamond polygon', () => {
    const { container } = render(<Board />)
    const polygon = container.querySelector('polygon')
    expect(polygon).not.toBeNull()
    expect(polygon!.getAttribute('fill')).toBe('#FFFDE7')
  })
})
