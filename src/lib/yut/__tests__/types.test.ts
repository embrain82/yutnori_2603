import { describe, it, expect } from 'vitest'
import {
  THROW_STEPS,
  GRANTS_EXTRA_THROW,
  HOME,
  FINISH,
} from '@/lib/yut/types'

describe('types constants', () => {
  describe('THROW_STEPS', () => {
    it('maps do to 1 step', () => {
      expect(THROW_STEPS['do']).toBe(1)
    })

    it('maps gae to 2 steps', () => {
      expect(THROW_STEPS['gae']).toBe(2)
    })

    it('maps geol to 3 steps', () => {
      expect(THROW_STEPS['geol']).toBe(3)
    })

    it('maps yut to 4 steps', () => {
      expect(THROW_STEPS['yut']).toBe(4)
    })

    it('maps mo to 5 steps', () => {
      expect(THROW_STEPS['mo']).toBe(5)
    })

    it('has exactly 5 entries', () => {
      expect(Object.keys(THROW_STEPS).length).toBe(5)
    })
  })

  describe('GRANTS_EXTRA_THROW', () => {
    it('grants extra throw for yut', () => {
      expect(GRANTS_EXTRA_THROW['yut']).toBe(true)
    })

    it('grants extra throw for mo', () => {
      expect(GRANTS_EXTRA_THROW['mo']).toBe(true)
    })

    it('does not grant extra throw for do', () => {
      expect(GRANTS_EXTRA_THROW['do']).toBe(false)
    })

    it('does not grant extra throw for gae', () => {
      expect(GRANTS_EXTRA_THROW['gae']).toBe(false)
    })

    it('does not grant extra throw for geol', () => {
      expect(GRANTS_EXTRA_THROW['geol']).toBe(false)
    })

    it('has exactly 5 entries', () => {
      expect(Object.keys(GRANTS_EXTRA_THROW).length).toBe(5)
    })
  })

  describe('special station constants', () => {
    it('HOME equals -1', () => {
      expect(HOME).toBe(-1)
    })

    it('FINISH equals -2', () => {
      expect(FINISH).toBe(-2)
    })
  })
})
