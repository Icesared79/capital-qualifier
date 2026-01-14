'use client'

interface MultiSelectProps {
  options: { value: string; label: string; description?: string }[]
  selected: string[]
  onChange: (selected: string[]) => void
  disabled?: boolean
}

export default function MultiSelect({ options, selected, onChange, disabled }: MultiSelectProps) {
  const toggleOption = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value))
    } else {
      onChange([...selected, value])
    }
  }

  return (
    <div className="space-y-3">
      {options.map((option) => {
        const isSelected = selected.includes(option.value)
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => toggleOption(option.value)}
            disabled={disabled}
            className={`
              w-full py-4 px-5 rounded-btn border text-left transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-accent/30 focus:ring-offset-2
              disabled:opacity-50 disabled:cursor-not-allowed
              ${isSelected
                ? 'border-accent bg-accent/5'
                : 'border-border-light bg-surface hover:border-border hover:bg-card-warm'
              }
            `}
          >
            <div className="flex items-center gap-4">
              <div className={`
                w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0
                transition-all duration-200
                ${isSelected ? 'border-accent bg-accent' : 'border-border'}
              `}>
                {isSelected && (
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 12 12">
                    <path d="M10.28 2.28L3.989 8.575 1.695 6.28A1 1 0 00.28 7.695l3 3a1 1 0 001.414 0l7-7A1 1 0 0010.28 2.28z" />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-medium ${isSelected ? 'text-text-primary' : 'text-text-primary'}`}>
                  {option.label}
                </p>
                {option.description && (
                  <p className="mt-1 text-sm text-text-secondary">
                    {option.description}
                  </p>
                )}
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
