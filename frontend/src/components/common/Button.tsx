import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'danger'
  | 'success'

type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  fullWidth?: boolean
  children: ReactNode
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-primary-600 text-white hover:bg-primary-700 focus-visible:ring-primary-500',

  secondary:
    'bg-secondary-500 text-white hover:bg-secondary-600 focus-visible:ring-secondary-500',

  outline:
    'border border-border bg-white text-text-primary hover:bg-slate-50 focus-visible:ring-primary-500',

  ghost:
    'bg-transparent text-text-primary hover:bg-slate-100 focus-visible:ring-primary-500',

  danger:
    'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500',

  success:
    'bg-secondary-500 text-white hover:bg-secondary-600 focus-visible:ring-secondary-500',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-2 text-sm rounded-lg',
  md: 'px-5 py-2.5 text-sm rounded-xl',
  lg: 'px-6 py-3 text-base rounded-xl',
}

function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled,
  children,
  className = '',
  type = 'button',
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading

  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-busy={loading}
      className={[
        'inline-flex items-center justify-center gap-2',
        'font-medium transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'active:scale-[0.98]',
        variantStyles[variant],
        sizeStyles[size],
        fullWidth ? 'w-full' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {loading ? (
        <Loader2 size={18} className="animate-spin" aria-hidden="true" />
      ) : (
        leftIcon
      )}

      <span>{children}</span>

      {!loading && rightIcon}
    </button>
  )
}

export default Button