import { describe, it, expect } from 'vitest'
import { STATION_COORDS, BOARD_VIEWBOX } from '@/lib/yut/boardCoords'
import type { StationCoord } from '@/lib/yut/boardCoords'

describe('boardCoords', () => {
  it('STATION_COORDS contains exactly 29 entries (keys 0-19, 20-28)', () => {
    const keys = Object.keys(STATION_COORDS).map(Number).sort((a, b) => a - b)
    expect(keys).toHaveLength(29)

    const expectedKeys = [
      ...Array.from({ length: 20 }, (_, i) => i), // 0-19
      20, 21, 22, 23, 24, 25, 26, 27, 28,
    ]
    expect(keys).toEqual(expectedKeys)
  })

  it('all coordinates are within viewBox bounds (x: 30-470, y: 30-470)', () => {
    for (const [id, coord] of Object.entries(STATION_COORDS)) {
      expect(coord.x).toBeGreaterThanOrEqual(30)
      expect(coord.x).toBeLessThanOrEqual(470)
      expect(coord.y).toBeGreaterThanOrEqual(30)
      expect(coord.y).toBeLessThanOrEqual(470)
    }
  })

  it('no two stations overlap -- minimum 25px Euclidean distance between any pair', () => {
    const ids = Object.keys(STATION_COORDS).map(Number)
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const a = STATION_COORDS[ids[i]]
        const b = STATION_COORDS[ids[j]]
        const dist = Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
        expect(dist).toBeGreaterThanOrEqual(25)
      }
    }
  })

  it('corner stations match expected coordinates', () => {
    expect(STATION_COORDS[0]).toEqual({ x: 40, y: 250 })
    expect(STATION_COORDS[5]).toEqual({ x: 250, y: 40 })
    expect(STATION_COORDS[10]).toEqual({ x: 460, y: 250 })
    expect(STATION_COORDS[15]).toEqual({ x: 250, y: 460 })
  })

  it('center station S22 is at (250, 250)', () => {
    expect(STATION_COORDS[22]).toEqual({ x: 250, y: 250 })
  })

  it('outer ring stations form a diamond -- S0-S5 edge goes from left to top with linear interpolation', () => {
    // S0 to S5: 5 intervals, each station equally spaced
    for (let i = 0; i <= 5; i++) {
      const t = i / 5
      const expectedX = 40 + (250 - 40) * t
      const expectedY = 250 + (40 - 250) * t
      expect(STATION_COORDS[i].x).toBeCloseTo(expectedX, 5)
      expect(STATION_COORDS[i].y).toBeCloseTo(expectedY, 5)
    }
  })

  it('diagonal stations 20,21 lie on the line from S5 to S22', () => {
    const s5 = STATION_COORDS[5]
    const s22 = STATION_COORDS[22]

    // S20 at 1/3, S21 at 2/3
    expect(STATION_COORDS[20].x).toBeCloseTo(s5.x + (s22.x - s5.x) * (1 / 3), 5)
    expect(STATION_COORDS[20].y).toBeCloseTo(s5.y + (s22.y - s5.y) * (1 / 3), 5)
    expect(STATION_COORDS[21].x).toBeCloseTo(s5.x + (s22.x - s5.x) * (2 / 3), 5)
    expect(STATION_COORDS[21].y).toBeCloseTo(s5.y + (s22.y - s5.y) * (2 / 3), 5)
  })

  it('diagonal stations 25,26 lie on the line from S10 to S22', () => {
    const s10 = STATION_COORDS[10]
    const s22 = STATION_COORDS[22]

    expect(STATION_COORDS[25].x).toBeCloseTo(s10.x + (s22.x - s10.x) * (1 / 3), 5)
    expect(STATION_COORDS[25].y).toBeCloseTo(s10.y + (s22.y - s10.y) * (1 / 3), 5)
    expect(STATION_COORDS[26].x).toBeCloseTo(s10.x + (s22.x - s10.x) * (2 / 3), 5)
    expect(STATION_COORDS[26].y).toBeCloseTo(s10.y + (s22.y - s10.y) * (2 / 3), 5)
  })

  it('diagonal stations 27,28 lie on the line from S22 to S0', () => {
    const s22 = STATION_COORDS[22]
    const s0 = STATION_COORDS[0]

    expect(STATION_COORDS[27].x).toBeCloseTo(s22.x + (s0.x - s22.x) * (1 / 3), 5)
    expect(STATION_COORDS[27].y).toBeCloseTo(s22.y + (s0.y - s22.y) * (1 / 3), 5)
    expect(STATION_COORDS[28].x).toBeCloseTo(s22.x + (s0.x - s22.x) * (2 / 3), 5)
    expect(STATION_COORDS[28].y).toBeCloseTo(s22.y + (s0.y - s22.y) * (2 / 3), 5)
  })

  it('diagonal stations 23,24 lie on the line from S22 to S15', () => {
    const s22 = STATION_COORDS[22]
    const s15 = STATION_COORDS[15]

    expect(STATION_COORDS[23].x).toBeCloseTo(s22.x + (s15.x - s22.x) * (1 / 3), 5)
    expect(STATION_COORDS[23].y).toBeCloseTo(s22.y + (s15.y - s22.y) * (1 / 3), 5)
    expect(STATION_COORDS[24].x).toBeCloseTo(s22.x + (s15.x - s22.x) * (2 / 3), 5)
    expect(STATION_COORDS[24].y).toBeCloseTo(s22.y + (s15.y - s22.y) * (2 / 3), 5)
  })

  it('BOARD_VIEWBOX equals "0 0 500 500"', () => {
    expect(BOARD_VIEWBOX).toBe('0 0 500 500')
  })

  it('StationCoord type has x and y number properties', () => {
    // Type check: ensure StationCoord interface has the expected shape
    const coord: StationCoord = STATION_COORDS[0]
    expect(typeof coord.x).toBe('number')
    expect(typeof coord.y).toBe('number')
  })
})
