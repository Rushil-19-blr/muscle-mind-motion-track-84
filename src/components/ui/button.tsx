import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-primary to-primary-light text-primary-foreground shadow-lg hover:shadow-glow hover:scale-105 active:scale-95",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-glass-border bg-glass/30 backdrop-blur-glass text-foreground shadow-glass hover:bg-glass/50 hover:shadow-elevated",
        secondary:
          "bg-gradient-to-r from-secondary to-secondary-light text-secondary-foreground shadow-lg hover:shadow-glow hover:scale-105 active:scale-95",
        ghost: "hover:bg-glass/30 hover:backdrop-blur-glass hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        glass: "bg-glass/20 backdrop-blur-glass border border-glass-border/50 text-foreground shadow-glass hover:bg-glass/30 hover:shadow-elevated",
        accent: "bg-gradient-to-r from-accent to-accent-glow text-accent-foreground shadow-lg hover:shadow-glow hover:scale-105 active:scale-95 animate-glow-pulse",
        success: "bg-success text-success-foreground shadow-lg hover:bg-success/90 hover:scale-105 active:scale-95",
      },
      size: {
        default: "h-11 px-6 py-3",
        sm: "h-9 rounded-xl px-4 text-xs",
        lg: "h-14 rounded-2xl px-10 text-base",
        icon: "h-11 w-11",
        xl: "h-16 rounded-3xl px-12 text-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
