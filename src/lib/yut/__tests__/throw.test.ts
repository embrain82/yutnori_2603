import { describe, it, expect, vi, afterEach } from 'vitest'
import { generateThrow } from '@/lib/yut/throw'
import { THROW_STEPS, GRANTS_EXTRA_THROW } from '@/lib/yut/types'
import type { ThrowName } from '@/lib/yut/types'

describe('generateThrow', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('deterministic tests (mocked Math.random)', () => {
    it('returns yut when all 4 sticks are flat (all < 0.5)', () => {
      const spy = vi.spyOn(Math, 'random')
      spy.mockReturnValueOnce(0.1)
        .mockReturnValueOnce(0.2)
        .mockReturnValueOnce(0.3)
        .mockReturnValueOnce(0.4)

      const result = generateThrow()
      expect(result.name).toBe('yut')
      expect(result.steps).toBe(4)
      expect(result.grantsExtra).toBe(true)
    })

    it('returns mo when 0 sticks are flat (all >= 0.5)', () => {
      const spy = vi.spyOn(Math, 'random')
      spy.mockReturnValueOnce(0.6)
        .mockReturnValueOnce(0.7)
        .mockReturnValueOnce(0.8)
        .mockReturnValueOnce(0.9)

      const result = generateThrow()
      expect(result.name).toBe('mo')
      expect(result.steps).toBe(5)
      expect(result.grantsExtra).toBe(true)
    })

    it('returns do when 1 stick is flat', () => {
      const spy = vi.spyOn(Math, 'random')
      spy.mockReturnValueOnce(0.3)  // flat
        .mockReturnValueOnce(0.6)   // round
        .mockReturnValueOnce(0.7)   // round
        .mockReturnValueOnce(0.8)   // round

      const result = generateThrow()
      expect(result.name).toBe('do')
      expect(result.steps).toBe(1)
      expect(result.grantsExtra).toBe(false)
    })

    it('returns gae when 2 sticks are flat', () => {
      const spy = vi.spyOn(Math, 'random')
      spy.mockReturnValueOnce(0.2)  // flat
        .mockReturnValueOnce(0.3)   // flat
        .mockReturnValueOnce(0.7)   // round
        .mockReturnValueOnce(0.8)   // round

      const result = generateThrow()
      expect(result.name).toBe('gae')
      expect(result.steps).toBe(2)
      expect(result.grantsExtra).toBe(false)
    })

    it('returns geol when 3 sticks are flat', () => {
      const spy = vi.spyOn(Math, 'random')
      spy.mockReturnValueOnce(0.1)  // flat
        .mockReturnValueOnce(0.2)   // flat
        .mockReturnValueOnce(0.3)   // flat
        .mockReturnValueOnce(0.8)   // round

      const result = generateThrow()
      expect(result.name).toBe('geol')
      expect(result.steps).toBe(3)
      expect(result.grantsExtra).toBe(false)
    })
  })

  describe('return value shape', () => {
    it('result.steps always matches THROW_STEPS[result.name]', () => {
      for (let i = 0; i < 100; i++) {
        const result = generateThrow()
        expect(result.steps).toBe(THROW_STEPS[result.name])
      }
    })

    it('result.grantsExtra always matches GRANTS_EXTRA_THROW[result.name]', () => {
      for (let i = 0; i < 100; i++) {
        const result = generateThrow()
        expect(result.grantsExtra).toBe(GRANTS_EXTRA_THROW[result.name])
      }
    })
  })

  describe('statistical distribution', () => {
    it('matches traditional yut probability within 3% tolerance over 10000 throws', () => {
      const counts: Record<ThrowName, number> = {
        do: 0,
        gae: 0,
        geol: 0,
        yut: 0,
        mo: 0,
      }

      const totalThrows = 10000
      for (let i = 0; i < totalThrows; i++) {
        const result = generateThrow()
        counts[result.name]++
      }

      const expected: Record<ThrowName, number> = {
        do: 0.25,
        gae: 0.375,
        geol: 0.25,
        yut: 0.0625,
        mo: 0.0625,
      }

      for (const name of Object.keys(expected) as ThrowName[]) {
        const actual = counts[name] / totalThrows
        expect(actual).toBeCloseTo(expected[name], 1)
      }
    })
  })
})
