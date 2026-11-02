import { useId, useState } from 'react'
import type {
  InputHTMLAttributes,
  ReactNode,
} from 'react'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'

type InputSize = 'sm' | 'md' | 'lg'

interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string
  error?: string
  helperText?: string
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  inputSize?: InputSize
  fullWidth?: boolean
}

const sizeStyles: Record<InputSize, string> = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-4 py-3 text-base',
}

function Input({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  inputSize = 'md',
  fullWidth = true,
  type = 'text',
  id,
  disabled,
  className = '',
  ...props
}: InputProps) {
  const generatedId = useId()
  const inputId = id || generatedId

  const [passwordVisible, setPasswordVisible] = useState(false)

  const isPassword = type === 'password'
  const actualType =
    isPassword && passwordVisible ? 'text' : type

  const hasRightContent =
    isPassword || Boolean(rightIcon)

  return (
    <div className={fullWidth ? 'w-full' : 'w-auto'}>
      {label && (
        <label
          htmlFor={inputId}
          className="mb-2 block text-sm font-medium text-text-primary"
        >
          {label}

          {props.required && (
            <span className="ml-1 text-red-500">*</span>
          )}
        </label>
      )}

      <div
        className={[
          'flex items-center gap-2 rounded-xl border bg-white',
          'transition-all duration-200',
          'focus-within:ring-2 focus-within:ring-offset-1',
          error
            ? 'border-red-500 focus-within:border-red-500 focus-within:ring-red-100'
            : 'border-border focus-within:border-primary-600 focus-within:ring-primary-100',
          disabled ? 'cursor-not-allowed bg-slate-50 opacity-60' : '',
        ].join(' ')}
      >
        {leftIcon && (
          <span className="ml-3 shrink-0 text-slate-400">
            {leftIcon}
          </span>
        )}

        <input
          id={inputId}
          type={actualType}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={
            error
              ? `${inputId}-error`
              : helperText
                ? `${inputId}-helper`
                : undefined
          }
          className={[
            'min-w-0 flex-1 bg-transparent text-text-primary outline-none',
            'placeholder:text-slate-400',
            'disabled:cursor-not-allowed',
            sizeStyles[inputSize],
            leftIcon ? 'pl-0' : '',
            hasRightContent ? 'pr-0' : '',
            className,
          ].join(' ')}
          {...props}
        />

        {isPassword ? (
          <button
            type="button"
            disabled={disabled}
            onClick={() => setPasswordVisible((visible) => !visible)}
            aria-label={
              passwordVisible ? 'Hide password' : 'Show password'
            }
            className="mr-3 shrink-0 text-slate-400 transition hover:text-slate-700 disabled:cursor-not-allowed"
          >
            {passwordVisible ? (
              <EyeOff size={18} />
            ) : (
              <Eye size={18} />
            )}
          </button>
        ) : rightIcon ? (
          <span className="mr-3 shrink-0 text-slate-400">
            {rightIcon}
          </span>
        ) : null}
      </div>

      {error && (
        <p
          id={`${inputId}-error`}
          role="alert"
          className="mt-2 flex items-center gap-1 text-xs text-red-600"
        >
          <AlertCircle size={14} />
          {error}
        </p>
      )}

      {!error && helperText && (
        <p
          id={`${inputId}-helper`}
          className="mt-2 text-xs text-text-secondary"
        >
          {helperText}
        </p>
      )}
    </div>
  )
}

export default Input