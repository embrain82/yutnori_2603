/**
 * Mock for motion/react library.
 *
 * Renders motion components as their plain HTML/SVG equivalents
 * so tests can assert on structure without animation side effects.
 */
import React from 'react'

function createMotionProxy(): Record<string, React.FC<Record<string, unknown>>> {
  return new Proxy(
    {},
    {
      get(_target, prop: string) {
        const MotionComponent = React.forwardRef<
          unknown,
          Record<string, unknown>
        >(function MotionComponent(props, ref) {
          const {
            animate: _animate,
            initial: _initial,
            exit: _exit,
            transition: _transition,
            whileHover: _whileHover,
            whileTap: _whileTap,
            whileFocus: _whileFocus,
            whileDrag: _whileDrag,
            whileInView: _whileInView,
            variants: _variants,
            layout: _layout,
            layoutId: _layoutId,
            onAnimationStart: _onAnimationStart,
            onAnimationComplete: _onAnimationComplete,
            ...rest
          } = props
          return React.createElement(prop, { ...rest, ref })
        })
        MotionComponent.displayName = `motion.${prop}`
        return MotionComponent
      },
    },
  ) as Record<string, React.FC<Record<string, unknown>>>
}

export const motion = createMotionProxy()

export function AnimatePresence({
  children,
}: {
  children: React.ReactNode
}): React.ReactNode {
  return children
}
