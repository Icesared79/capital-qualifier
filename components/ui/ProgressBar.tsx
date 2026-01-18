'use client'

interface ProgressBarProps {
  currentStep: number
  totalSteps: number
}

export default function ProgressBar({ currentStep, totalSteps }: ProgressBarProps) {
  // Calculate progress to align with dot positions (dots are at 0%, 16.6%, 33.3%, etc.)
  const progress = totalSteps > 1 ? (currentStep / (totalSteps - 1)) * 100 : 0

  return (
    <div className="space-y-2">
      {/* Combined progress bar with dots */}
      <div className="relative">
        {/* Track */}
        <div className="h-1 bg-border-light rounded-full" />

        {/* Progress fill */}
        <div
          className="absolute top-0 left-0 h-1 bg-gradient-to-r from-accent to-accent-hover rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />

        {/* Step dots - positioned on top of the track */}
        <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 flex items-center justify-between">
          {Array.from({ length: totalSteps }, (_, index) => (
            <div
              key={index}
              className={`
                flex items-center justify-center rounded-full transition-all duration-300
                ${index === currentStep
                  ? 'w-3.5 h-3.5 bg-accent ring-4 ring-accent/20'
                  : index < currentStep
                  ? 'w-2.5 h-2.5 bg-accent'
                  : 'w-2.5 h-2.5 bg-border-light border-2 border-surface'
                }
              `}
            />
          ))}
        </div>
      </div>

      {/* Step counter */}
      <p className="text-center text-xs text-text-muted mt-4">
        Step {currentStep + 1} of {totalSteps}
      </p>
    </div>
  )
}
