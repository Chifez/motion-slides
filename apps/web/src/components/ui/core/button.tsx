import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  isLoading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-150 ease-out active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-1 focus-visible:ring-offset-(--ms-bg-base)'
    
    const variants = {
      primary: 'bg-blue-600 text-white hover:bg-blue-500 shadow-md shadow-blue-600/15 hover:shadow-blue-600/25 border-none',
      secondary: 'bg-(--ms-bg-elevated) text-(--ms-text-primary) hover:bg-(--ms-border) border border-(--ms-border)',
      outline: 'bg-transparent text-(--ms-text-primary) border-[1.5px] border-(--ms-border) hover:border-(--ms-border-strong) hover:bg-(--ms-bg-elevated)',
      ghost: 'bg-transparent text-(--ms-text-secondary) hover:text-(--ms-text-primary) hover:bg-(--ms-border) border-none cursor-pointer',
      danger: 'bg-red-600 text-white hover:bg-red-500 shadow-lg shadow-red-600/10 border-none'
    }

    const sizes = {
      sm: 'h-8 px-3 text-[11px]',
      md: 'h-9 px-4 text-xs',
      lg: 'h-10 px-5 text-sm',
      icon: 'h-8 w-8 p-0 flex items-center justify-center text-(--ms-text-muted) hover:text-(--ms-text-primary)'
    }

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <span className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : null}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
