'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Something went wrong!
        </h2>
        <button
          onClick={() => reset()}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
