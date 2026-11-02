import type { HTMLAttributes, ReactNode } from 'react'

type BadgeVariant =
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'neutral'
  | 'info'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode
  variant?: BadgeVariant
  dot?: boolean
}

const variantStyles: Record<BadgeVariant, string> = {
  primary: 'bg-blue-50 text-blue-700',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  danger: 'bg-red-50 text-red-700',
  neutral: 'bg-slate-100 text-slate-700',
  info: 'bg-cyan-50 text-cyan-700',
}

const dotStyles: Record<BadgeVariant, string> = {
  primary: 'bg-blue-600',
  success: 'bg-emerald-600',
  warning: 'bg-amber-500',
  danger: 'bg-red-600',
  neutral: 'bg-slate-500',
  info: 'bg-cyan-600',
}

function Badge({
  children,
  variant = 'neutral',
  dot = false,
  className = '',
  ...props
}: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1',
        'text-xs font-semibold',
        variantStyles[variant],
        className,
      ].join(' ')}
      {...props}
    >
      {dot && (
        <span
          className={`h-1.5 w-1.5 rounded-full ${dotStyles[variant]}`}
        />
      )}

      {children}
    </span>
  )
}

export default Badge