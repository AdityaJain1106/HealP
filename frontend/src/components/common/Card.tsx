
import type { HTMLAttributes, ReactNode } from 'react'

type CardPadding = 'none' | 'sm' | 'md' | 'lg'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  padding?: CardPadding
  hoverable?: boolean
  bordered?: boolean
}

const paddingStyles: Record<CardPadding, string> = {
  none: 'p-0',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-7',
}

function Card({
  children,
  padding = 'md',
  hoverable = false,
  bordered = true,
  className = '',
  ...props
}: CardProps) {
  return (
    <div
      className={[
        'relative rounded-2xl bg-white',
        bordered ? 'border border-border' : '',
        'shadow-sm',
        paddingStyles[padding],
        hoverable
          ? 'transition-all duration-200 hover:-translate-y-1 hover:shadow-md'
          : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </div>
  )
}

export default Card
