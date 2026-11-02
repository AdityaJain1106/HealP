import { Loader2 } from 'lucide-react'

type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl'

interface SpinnerProps {
  size?: SpinnerSize
  color?: string
  label?: string
  fullScreen?: boolean
}

const sizeStyles: Record<SpinnerSize, string> = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-10 w-10',
  xl: 'h-14 w-14',
}

function Spinner({
  size = 'md',
  color = 'text-primary-600',
  label = 'Loading...',
  fullScreen = false,
}: SpinnerProps) {
  const spinner = (
    <div
      role="status"
      className="flex items-center justify-center gap-3"
    >
      <Loader2
        className={`animate-spin ${sizeStyles[size]} ${color}`}
      />

      {label && (
        <span className="text-sm font-medium text-text-secondary">
          {label}
        </span>
      )}

      <span className="sr-only">{label || 'Loading'}</span>
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
        {spinner}
      </div>
    )
  }

  return spinner
}

export default Spinner