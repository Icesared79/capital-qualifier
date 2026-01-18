'use client'

import { useEffect, useState, ReactNode } from 'react'

interface AnimatedStepProps {
  children: ReactNode
  stepKey: number | string
}

export default function AnimatedStep({ children, stepKey }: AnimatedStepProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [currentKey, setCurrentKey] = useState(stepKey)

  useEffect(() => {
    if (stepKey !== currentKey) {
      setIsVisible(false)
      const timeout = setTimeout(() => {
        setCurrentKey(stepKey)
        setIsVisible(true)
      }, 150)
      return () => clearTimeout(timeout)
    } else {
      const timeout = setTimeout(() => setIsVisible(true), 50)
      return () => clearTimeout(timeout)
    }
  }, [stepKey, currentKey])

  return (
    <div
      className={`transition-all duration-300 ease-out ${
        isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-5'
      }`}
    >
      {children}
    </div>
  )
}
