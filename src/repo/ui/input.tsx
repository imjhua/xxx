import * as React from 'react'

import { cn } from '../../lib/utils'

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type, value, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
          props.readOnly
            ? 'cursor-default focus-visible:outline-none focus-visible:ring-0 border-none shadow-none'
            : 'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
          className
        )}
        ref={ref}
        value={value || ''}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }
