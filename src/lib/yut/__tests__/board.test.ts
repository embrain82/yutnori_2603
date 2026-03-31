import { describe, it, expect } from 'vitest'
import { ROUTE_IDS, ROUTES, BRANCH_POINTS } from '@/lib/yut/board'

describe('board graph', () => {
  describe('ROUTES', () => {
    it('has exactly 5 routes', () => {
      expect(Object.keys(ROUTES).length).toBe(5)
    })

    it('outer route has 20 stations', () => {
      expect(ROUTES[ROUTE_IDS.OUTER].length).toBe(20)
    })

    it('outer route starts at 0 and ends at 19', () => {
      const outer = ROUTES[ROUTE_IDS.OUTER]
      expect(outer[0]).toBe(0)
      expect(outer[outer.length - 1]).toBe(19)
    })

    it('diag_right route is [5, 20, 21, 22, 23, 24] with 6 stations', () => {
      const route = ROUTES[ROUTE_IDS.DIAG_RIGHT]
      expect(route).toEqual([5, 20, 21, 22, 23, 24])
      expect(route.length).toBe(6)
    })

    it('diag_left route is [10, 25, 26, 22, 27, 28] with 6 stations', () => {
      const route = ROUTES[ROUTE_IDS.DIAG_LEFT]
      expect(route).toEqual([10, 25, 26, 22, 27, 28])
      expect(route.length).toBe(6)
    })

    it('center_down route is [22, 23, 15] with 3 stations', () => {
      const route = ROUTES[ROUTE_IDS.CENTER_DOWN]
      expect(route).toEqual([22, 23, 15])
      expect(route.length).toBe(3)
    })

    it('center_up route is [22, 27, 28] with 3 stations', () => {
      const route = ROUTES[ROUTE_IDS.CENTER_UP]
      expect(route).toEqual([22, 27, 28])
      expect(route.length).toBe(3)
    })

    it('has exactly 29 unique stations across all routes', () => {
      const allStations = new Set<number>()
      for (const route of Object.values(ROUTES)) {
        for (const station of route) {
          allStations.add(station)
        }
      }
      expect(allStations.size).toBe(29)
    })
  })

  describe('BRANCH_POINTS', () => {
    it('has entries for station 5 and station 10 only', () => {
      const keys = Object.keys(BRANCH_POINTS).map(Number)
      expect(keys).toHaveLength(2)
      expect(keys).toContain(5)
      expect(keys).toContain(10)
    })

    it('station 5 continues on outer, shortcuts to diag_right', () => {
      expect(BRANCH_POINTS[5].continueRoute).toBe('outer')
      expect(BRANCH_POINTS[5].shortcutRoute).toBe('diag_right')
    })

    it('station 10 continues on outer, shortcuts to diag_left', () => {
      expect(BRANCH_POINTS[10].continueRoute).toBe('outer')
      expect(BRANCH_POINTS[10].shortcutRoute).toBe('diag_left')
    })
  })

  describe('center station sharing', () => {
    it('station 22 appears in diag_right, diag_left, center_down, and center_up', () => {
      const routesWithStation22: string[] = []
      for (const [routeId, stations] of Object.entries(ROUTES)) {
        if (stations.includes(22)) {
          routesWithStation22.push(routeId)
        }
      }
      expect(routesWithStation22).toHaveLength(4)
      expect(routesWithStation22).toContain(ROUTE_IDS.DIAG_RIGHT)
      expect(routesWithStation22).toContain(ROUTE_IDS.DIAG_LEFT)
      expect(routesWithStation22).toContain(ROUTE_IDS.CENTER_DOWN)
      expect(routesWithStation22).toContain(ROUTE_IDS.CENTER_UP)
    })
  })
})
