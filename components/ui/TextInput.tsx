'use client'

import { InputHTMLAttributes, forwardRef, useState } from 'react'

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    const [focused, setFocused] = useState(false)
    const inputId = id || label.toLowerCase().replace(/\s+/g, '-')
    const hasValue = props.value !== undefined && props.value !== ''

    return (
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          onFocus={(e) => {
            setFocused(true)
            props.onFocus?.(e)
          }}
          onBlur={(e) => {
            setFocused(false)
            props.onBlur?.(e)
          }}
          className={`
            peer w-full px-4 pt-6 pb-2 rounded-btn border bg-surface
            text-text-primary placeholder-transparent font-normal
            transition-all duration-200
            focus:outline-none focus:ring-0
            ${error
              ? 'border-red-500 focus:border-red-500'
              : 'border-border-light focus:border-accent'
            }
            ${className}
          `}
          placeholder={label}
          {...props}
        />
        <label
          htmlFor={inputId}
          className={`
            absolute left-4 transition-all duration-200 pointer-events-none
            ${focused || hasValue
              ? 'top-2 text-xs font-medium'
              : 'top-1/2 -translate-y-1/2 text-base'
            }
            ${error
              ? 'text-red-500'
              : focused
                ? 'text-accent'
                : 'text-text-muted'
            }
          `}
        >
          {label}
        </label>
        {error && (
          <p className="mt-1.5 text-sm text-red-500">{error}</p>
        )}
      </div>
    )
  }
)

TextInput.displayName = 'TextInput'

export default TextInput
