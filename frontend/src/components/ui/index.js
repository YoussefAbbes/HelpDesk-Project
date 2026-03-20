/**
 * UI Components - Central export file
 *
 * Usage:
 * import { Button, Modal, Skeleton } from '@/components/ui'
 */

// Modal components
export { default as Modal, ConfirmModal } from './Modal'

// Skeleton components
export {
  default as Skeleton,
  SkeletonText,
  SkeletonParagraph,
  SkeletonAvatar,
  SkeletonCard,
  SkeletonTicketCard,
  SkeletonKPICard,
  SkeletonTableRow,
  SkeletonTable,
  SkeletonButton,
  SkeletonImage,
} from './Skeleton'

// Button components
export { default as Button, ButtonGroup, IconButton } from './Button'

// Empty state components
export {
  default as EmptyState,
  NoTickets,
  NoSearchResults,
  NoNotifications,
  ErrorState,
  SuccessState,
} from './EmptyState'

// File uploader components
export { default as FileUploader, CompactFileUploader } from './FileUploader'

// Theme components
export { default as ThemeToggle, ThemeSelector, ThemeDropdown } from './ThemeToggle'
