'use client'

interface ProgressBarProps {
  currentStep: number
  totalSteps: number
}

export default function ProgressBar({ currentStep, totalSteps }: ProgressBarProps) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: totalSteps }, (_, index) => (
        <div
          key={index}
          className={`
            w-2 h-2 rounded-full transition-all duration-200
            ${index <= currentStep
              ? 'bg-accent'
              : 'bg-border-light'
            }
          `}
        />
      ))}
    </div>
  )
}
