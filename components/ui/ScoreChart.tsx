'use client'

import { useEffect, useRef } from 'react'

interface DimensionData {
  dimension: string
  score: number
  maxScore: number
  icon?: string
  insights?: string[]
}

interface ScoreChartProps {
  dimensions: Record<string, DimensionData>
  overallScore: number
}

export default function ScoreChart({ dimensions, overallScore }: ScoreChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set up canvas for retina displays
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const radius = Math.min(centerX, centerY) - 40

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height)

    const dimensionKeys = Object.keys(dimensions)
    const numDimensions = dimensionKeys.length
    const angleStep = (2 * Math.PI) / numDimensions
    const startAngle = -Math.PI / 2 // Start from top

    // Draw grid lines (5 levels)
    for (let level = 1; level <= 5; level++) {
      const levelRadius = (radius * level) / 5
      ctx.beginPath()
      ctx.strokeStyle = level === 5 ? '#e5e7eb' : '#f3f4f6'
      ctx.lineWidth = 1

      for (let i = 0; i <= numDimensions; i++) {
        const angle = startAngle + i * angleStep
        const x = centerX + Math.cos(angle) * levelRadius
        const y = centerY + Math.sin(angle) * levelRadius
        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      }
      ctx.closePath()
      ctx.stroke()
    }

    // Draw axis lines
    dimensionKeys.forEach((_, i) => {
      const angle = startAngle + i * angleStep
      ctx.beginPath()
      ctx.strokeStyle = '#e5e7eb'
      ctx.lineWidth = 1
      ctx.moveTo(centerX, centerY)
      ctx.lineTo(centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius)
      ctx.stroke()
    })

    // Draw data polygon
    ctx.beginPath()
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius)
    gradient.addColorStop(0, 'rgba(16, 185, 129, 0.1)')
    gradient.addColorStop(1, 'rgba(16, 185, 129, 0.3)')

    dimensionKeys.forEach((key, i) => {
      const dim = dimensions[key]
      const percentage = dim.score / dim.maxScore
      const dataRadius = radius * percentage
      const angle = startAngle + i * angleStep
      const x = centerX + Math.cos(angle) * dataRadius
      const y = centerY + Math.sin(angle) * dataRadius

      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })
    ctx.closePath()
    ctx.fillStyle = gradient
    ctx.fill()
    ctx.strokeStyle = '#10b981'
    ctx.lineWidth = 2
    ctx.stroke()

    // Draw data points
    dimensionKeys.forEach((key, i) => {
      const dim = dimensions[key]
      const percentage = dim.score / dim.maxScore
      const dataRadius = radius * percentage
      const angle = startAngle + i * angleStep
      const x = centerX + Math.cos(angle) * dataRadius
      const y = centerY + Math.sin(angle) * dataRadius

      ctx.beginPath()
      ctx.arc(x, y, 5, 0, 2 * Math.PI)
      ctx.fillStyle = '#10b981'
      ctx.fill()
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 2
      ctx.stroke()
    })

    // Draw labels
    ctx.font = '12px system-ui, sans-serif'
    ctx.fillStyle = '#374151'
    ctx.textAlign = 'center'

    dimensionKeys.forEach((key, i) => {
      const dim = dimensions[key]
      const angle = startAngle + i * angleStep
      const labelRadius = radius + 25
      const x = centerX + Math.cos(angle) * labelRadius
      const y = centerY + Math.sin(angle) * labelRadius

      // Adjust text alignment based on position
      if (Math.abs(angle - startAngle) < 0.1) {
        ctx.textBaseline = 'bottom'
      } else if (Math.abs(angle - (startAngle + Math.PI)) < 0.1) {
        ctx.textBaseline = 'top'
      } else {
        ctx.textBaseline = 'middle'
      }

      ctx.fillText(dim.dimension.split(' ')[0], x, y)
    })

  }, [dimensions, overallScore])

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        className="w-full"
        style={{ height: '300px' }}
      />
      {/* Center score */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center">
          <div className="text-4xl font-bold text-gray-900">{overallScore}</div>
          <div className="text-sm text-gray-500">Score</div>
        </div>
      </div>
    </div>
  )
}
