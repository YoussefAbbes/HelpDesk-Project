/**
 * Button - Enhanced button component with variants, sizes, and loading state
 *
 * Features:
 * - Multiple variants (primary, secondary, ghost, danger, success)
 * - Multiple sizes (sm, md, lg)
 * - Loading state with spinner
 * - Icon support (left, right, or icon-only)
 * - Disabled state
 * - Smooth hover/active transitions
 */

import React from 'react'
import { Loader2 } from 'lucide-react'

const variants = {
  primary: `
    bg-primary-600 text-white
    hover:bg-primary-700 hover:shadow-md hover:-translate-y-0.5
    active:translate-y-0 active:shadow-sm
    focus:ring-primary-500
    dark:bg-primary-500 dark:hover:bg-primary-600
  `,
  secondary: `
    bg-white text-gray-700 border border-gray-300
    hover:bg-gray-50 hover:border-gray-400 hover:shadow-sm
    active:bg-gray-100
    dark:bg-dark-card dark:text-gray-200 dark:border-dark-border
    dark:hover:bg-dark-hover dark:hover:border-gray-500
  `,
  ghost: `
    bg-transparent text-gray-600
    hover:bg-gray-100 hover:text-gray-900
    dark:text-gray-400 dark:hover:bg-dark-card dark:hover:text-gray-200
  `,
  danger: `
    bg-error-600 text-white
    hover:bg-error-700 hover:shadow-md hover:-translate-y-0.5
    focus:ring-error-500
    dark:bg-error-500 dark:hover:bg-error-600
  `,
  success: `
    bg-success-600 text-white
    hover:bg-success-700 hover:shadow-md hover:-translate-y-0.5
    focus:ring-success-500
    dark:bg-success-500 dark:hover:bg-success-600
  `,
  outline: `
    bg-transparent text-primary-600 border border-primary-600
    hover:bg-primary-50
    dark:text-primary-400 dark:border-primary-400 dark:hover:bg-primary-900/30
  `,
}

const sizes = {
  sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
  md: 'px-4 py-2.5 text-sm rounded-xl gap-2',
  lg: 'px-6 py-3 text-base rounded-xl gap-2',
}

const iconOnlySizes = {
  sm: 'p-1.5 rounded-lg',
  md: 'p-2.5 rounded-xl',
  lg: 'p-3 rounded-xl',
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  iconOnly = false,
  className = '',
  type = 'button',
  ...props
}) {
  const isDisabled = disabled || isLoading

  const baseClasses = `
    inline-flex items-center justify-center
    font-medium
    transition-all duration-200
    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
    focus:outline-none focus:ring-2 focus:ring-offset-2
    dark:focus:ring-offset-dark-bg
  `

  const sizeClass = iconOnly ? iconOnlySizes[size] : sizes[size]
  const variantClass = variants[variant]

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={`${baseClasses} ${sizeClass} ${variantClass} ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className={`animate-spin ${size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'}`} />
          {!iconOnly && <span>Loading...</span>}
        </>
      ) : (
        <>
          {LeftIcon && <LeftIcon className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />}
          {!iconOnly && children}
          {RightIcon && <RightIcon className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />}
        </>
      )}
    </button>
  )
}

// Button Group for related actions
export function ButtonGroup({ children, className = '' }) {
  return (
    <div className={`inline-flex rounded-xl overflow-hidden shadow-sm ${className}`}>
      {React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return child
        return React.cloneElement(child, {
          className: `
            ${child.props.className || ''}
            rounded-none
            ${index === 0 ? 'rounded-l-xl' : ''}
            ${index === React.Children.count(children) - 1 ? 'rounded-r-xl' : ''}
            ${index !== 0 ? 'border-l-0' : ''}
          `,
        })
      })}
    </div>
  )
}

// Icon Button shorthand
export function IconButton({
  icon: Icon,
  label,
  variant = 'ghost',
  size = 'md',
  className = '',
  ...props
}) {
  return (
    <Button
      variant={variant}
      size={size}
      iconOnly
      aria-label={label}
      className={className}
      {...props}
    >
      <Icon className={size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5'} />
    </Button>
  )
}
