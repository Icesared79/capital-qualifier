'use client'

import { useState, useEffect } from 'react'

export default function DashboardPreview() {
  const [score, setScore] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
    // Animate score counting up
    const targetScore = 87
    const duration = 1500
    const steps = 30
    const increment = targetScore / steps
    let current = 0

    const timer = setInterval(() => {
      current += increment
      if (current >= targetScore) {
        setScore(targetScore)
        clearInterval(timer)
      } else {
        setScore(Math.floor(current))
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden shadow-2xl transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      {/* Dashboard Header */}
      <div className="bg-gray-900 dark:bg-gray-950 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <div className="w-3 h-3 rounded-full bg-green-500" />
        </div>
        <div className="flex items-center gap-2">
          <div className="px-2 py-1 bg-green-500/20 rounded text-xs font-bold text-green-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            Verified
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="p-5">
        {/* Score Section */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Portfolio Score</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-gray-900 dark:text-white">{score}</span>
              <span className="text-lg font-bold text-green-500">A-</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Status</p>
            <p className="text-sm font-bold text-green-600 dark:text-green-400">Pre-Qualified</p>
          </div>
        </div>

        {/* Score Bars */}
        <div className="space-y-3 mb-5">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-500 dark:text-gray-400">Portfolio Quality</span>
              <span className="font-bold text-gray-700 dark:text-gray-300">92%</span>
            </div>
            <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full transition-all duration-1000" style={{ width: isVisible ? '92%' : '0%' }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-500 dark:text-gray-400">Documentation</span>
              <span className="font-bold text-gray-700 dark:text-gray-300">85%</span>
            </div>
            <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full transition-all duration-1000 delay-150" style={{ width: isVisible ? '85%' : '0%' }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-500 dark:text-gray-400">Compliance</span>
              <span className="font-bold text-gray-700 dark:text-gray-300">88%</span>
            </div>
            <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-purple-500 rounded-full transition-all duration-1000 delay-300" style={{ width: isVisible ? '88%' : '0%' }} />
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <p className="text-lg font-black text-gray-900 dark:text-white">$24M</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Portfolio</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-black text-gray-900 dark:text-white">156</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Assets</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-black text-gray-900 dark:text-white">1-2w</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Est. Time</p>
          </div>
        </div>
      </div>

      {/* AI Badge */}
      <div className="px-5 pb-4">
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg px-3 py-2 flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L10 6.477V16h2a1 1 0 110 2H8a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-700 dark:text-gray-300">AI-Powered Analysis</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Scored in under 2 minutes</p>
          </div>
        </div>
      </div>
    </div>
  )
}
