'use client'

import { useEffect, useState } from 'react'

interface ConfettiPiece {
  id: number
  x: number
  color: string
  delay: number
  duration: number
  size: number
  shape: 'square' | 'circle' | 'rectangle'
}

const COLORS = ['#FF6B35', '#FFB347', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#FF69B4', '#87CEEB']
const SHAPES: Array<'square' | 'circle' | 'rectangle'> = ['square', 'circle', 'rectangle']

export default function Confetti() {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([])
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const newPieces: ConfettiPiece[] = Array.from({ length: 80 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      delay: Math.random() * 0.8,
      duration: 2.5 + Math.random() * 2,
      size: 8 + Math.random() * 8,
      shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
    }))
    setPieces(newPieces)

    const timeout = setTimeout(() => setIsVisible(false), 5000)
    return () => clearTimeout(timeout)
  }, [])

  if (!isVisible) return null

  const getShapeClass = (shape: string) => {
    switch (shape) {
      case 'circle': return 'rounded-full'
      case 'rectangle': return 'rounded-sm'
      default: return 'rotate-45'
    }
  }

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute top-0 animate-confetti"
          style={{
            left: `${piece.x}%`,
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
          }}
        >
          <div
            className={getShapeClass(piece.shape)}
            style={{
              backgroundColor: piece.color,
              width: piece.shape === 'rectangle' ? piece.size * 0.5 : piece.size,
              height: piece.size,
            }}
          />
        </div>
      ))}
    </div>
  )
}
