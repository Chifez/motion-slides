import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'flex h-9 w-full rounded-md border border-(--ms-border) bg-(--ms-bg-base) px-3 py-1 text-sm shadow-sm transition-colors',
          'file:border-0 file:bg-transparent file:text-sm file:font-medium',
          'placeholder:text-(--ms-text-muted)',
          'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error && 'border-red-500 focus-visible:ring-red-500',
          className
        )}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'
