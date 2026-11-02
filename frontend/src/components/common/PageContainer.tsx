import type { HTMLAttributes, ReactNode } from 'react'

type ContainerSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'

interface PageContainerProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  size?: ContainerSize
  padding?: boolean
}

const sizeStyles: Record<ContainerSize, string> = {
  sm: 'max-w-2xl',
  md: 'max-w-3xl',
  lg: 'max-w-5xl',
  xl: 'max-w-6xl',
  '2xl': 'max-w-7xl',
  full: 'max-w-full',
}

function PageContainer({
  children,
  size = '2xl',
  padding = true,
  className = '',
  ...props
}: PageContainerProps) {
  return (
    <div
      className={[
        'mx-auto w-full',
        sizeStyles[size],
        padding ? 'px-4 py-6 sm:px-6 lg:px-8' : '',
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

export default PageContainer