/**
 * Mock for motion/react in test environment.
 *
 * Provides a Proxy-based motion object that returns the underlying HTML/SVG
 * tag name for any property access (e.g., motion.div -> 'div', motion.circle -> 'circle').
 * AnimatePresence simply renders children. useAnimate returns a ref and noop function.
 */
import { vi } from 'vitest'
import React from 'react'

export const motion = new Proxy(
  {},
  {
    get(_target, prop: string) {
      return React.forwardRef(function MotionComponent(
        props: Record<string, unknown>,
        ref: React.Ref<unknown>,
      ) {
        // Filter out motion-specific props before passing to DOM element
        const {
          initial,
          animate,
          exit,
          transition,
          whileHover,
          whileTap,
          whileDrag,
          whileInView,
          whileFocus,
          variants,
          layout,
          layoutId,
          onAnimationComplete,
          onAnimationStart,
          ...domProps
        } = props
        return React.createElement(prop, { ...domProps, ref })
      })
    },
  },
)

export function AnimatePresence({ children }: { children: React.ReactNode }): React.ReactNode {
  return children
}

export function useAnimate(): [React.RefObject<null>, () => void] {
  return [{ current: null }, vi.fn()]
}
