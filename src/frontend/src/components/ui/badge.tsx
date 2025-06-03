import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        // Primary: Only for key accent badges
        default:
          "border-transparent bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
        // Secondary: Most common badges (grayscale)
        secondary:
          "border-transparent bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-600",
        // Outline: Clean bordered badges
        outline: 
          "border-gray-200 bg-background text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800",
        // Functional colors (minimal usage)
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        success:
          "border-transparent bg-green-500 text-white shadow-sm hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700",
        warning:
          "border-transparent bg-amber-500 text-white shadow-sm hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants } 