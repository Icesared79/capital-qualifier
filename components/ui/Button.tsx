'use client'

import { ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', fullWidth = false, children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

    const variants = {
      primary: 'bg-text-primary text-background hover:opacity-80 active:opacity-90',
      secondary: 'border border-border text-text-primary hover:border-accent hover:text-accent bg-surface',
      outline: 'border-2 border-accent text-accent hover:bg-accent hover:text-white bg-transparent',
      ghost: 'text-text-secondary hover:text-accent',
    }

    const sizes = {
      sm: 'px-4 py-2 text-sm rounded-btn',
      md: 'px-6 py-3.5 text-base rounded-btn',
      lg: 'px-8 py-4 text-base rounded-btn',
    }

    const widthClass = fullWidth ? 'w-full' : ''

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button
