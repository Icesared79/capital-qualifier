'use client'

import { ReactNode } from 'react'

interface SelectCardProps {
  label: string
  description?: string
  selected: boolean
  onClick: () => void
  disabled?: boolean
  icon?: ReactNode
}

export default function SelectCard({ label, description, selected, onClick, disabled, icon }: SelectCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full py-4 px-5 rounded-btn border text-left
        transition-all duration-200 ease-out
        focus:outline-none focus:ring-2 focus:ring-accent/30 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        hover:-translate-y-0.5 hover:shadow-md
        active:translate-y-0 active:shadow-sm
        ${selected
          ? 'border-accent bg-accent/5 shadow-sm ring-1 ring-accent/20'
          : 'border-border-light bg-surface hover:border-border hover:bg-card-warm'
        }
      `}
    >
      <div className="flex items-center gap-4">
        <div className={`
          w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
          transition-all duration-200
          ${selected ? 'border-accent bg-accent scale-110' : 'border-border'}
        `}>
          {selected && (
            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
          )}
        </div>
        {icon && (
          <div className={`
            w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
            transition-all duration-200
            ${selected ? 'bg-accent/10 text-accent' : 'bg-card-cool text-text-secondary'}
          `}>
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className={`font-medium ${selected ? 'text-text-primary' : 'text-text-primary'}`}>
            {label}
          </p>
          {description && (
            <p className="mt-1 text-sm text-text-secondary">
              {description}
            </p>
          )}
        </div>
      </div>
    </button>
  )
}
