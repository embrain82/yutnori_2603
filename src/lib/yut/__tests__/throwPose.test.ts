import { describe, expect, it } from 'vitest'
import { buildTargetPoses, YUT_THROW_FACE_COUNTS } from '@/lib/yut'
import type { ThrowResult } from '@/lib/yut'

const THROW_RESULTS: ThrowResult[] = [
  { name: 'do', steps: 1, grantsExtra: false },
  { name: 'gae', steps: 2, grantsExtra: false },
  { name: 'geol', steps: 3, grantsExtra: false },
  { name: 'yut', steps: 4, grantsExtra: true },
  { name: 'mo', steps: 5, grantsExtra: true },
]

describe('buildTargetPoses', () => {
  it('returns exactly one flat face for do', () => {
    const poses = buildTargetPoses(THROW_RESULTS[0])
    expect(poses.filter((pose) => pose.face === 'flat')).toHaveLength(1)
  })

  it('returns two flat faces for gae', () => {
    const poses = buildTargetPoses(THROW_RESULTS[1])
    expect(poses.filter((pose) => pose.face === 'flat')).toHaveLength(2)
  })

  it('returns three flat faces for geol', () => {
    const poses = buildTargetPoses(THROW_RESULTS[2])
    expect(poses.filter((pose) => pose.face === 'flat')).toHaveLength(3)
  })

  it('returns four flat faces for yut', () => {
    const poses = buildTargetPoses(THROW_RESULTS[3])
    expect(poses.filter((pose) => pose.face === 'flat')).toHaveLength(4)
  })

  it('returns four round faces for mo', () => {
    const poses = buildTargetPoses(THROW_RESULTS[4])
    expect(poses.filter((pose) => pose.face === 'round')).toHaveLength(4)
  })

  it('returns four ordered slots with numeric yaw values', () => {
    for (const result of THROW_RESULTS) {
      const poses = buildTargetPoses(result)

      expect(poses).toHaveLength(4)
      expect(poses.map((pose) => pose.slot)).toEqual([0, 1, 2, 3])

      for (const pose of poses) {
        expect(typeof pose.yaw).toBe('number')
        expect(Number.isInteger(pose.slot)).toBe(true)
      }
    }
  })

  it('exposes the authoritative flat-face counts by throw name', () => {
    expect(YUT_THROW_FACE_COUNTS).toEqual({
      do: 1,
      gae: 2,
      geol: 3,
      yut: 4,
      mo: 0,
    })
  })

  it('is available from the barrel export', () => {
    expect(typeof buildTargetPoses).toBe('function')
  })
})
