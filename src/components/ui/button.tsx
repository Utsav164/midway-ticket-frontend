import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:     "bg-sky-400 text-slate-900 hover:bg-sky-300 shadow-sm",
        secondary:   "bg-slate-800 text-white hover:bg-slate-700 border border-slate-700",
        outline:     "border border-sky-400 text-sky-500 hover:bg-sky-400 hover:text-slate-900",
        ghost:       "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
        destructive: "bg-red-500 text-white hover:bg-red-400 shadow-sm",
        success:     "bg-green-500 text-white hover:bg-green-400 shadow-sm",
        warning:     "bg-amber-500 text-white hover:bg-amber-400 shadow-sm",
        link:        "text-sky-500 underline-offset-4 hover:underline p-0 h-auto shadow-none",
        "ghost-dark":"text-slate-400 hover:text-white hover:bg-slate-800",
      },
      size: {
        default: "h-10 px-5 py-2.5",
        sm:      "h-8 px-3 py-1.5 text-xs rounded-lg",
        lg:      "h-12 px-7 py-3.5 text-base rounded-xl",
        icon:    "h-10 w-10 rounded-xl",
        "icon-sm":"h-8 w-8 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled ?? loading}
        {...props}
      >
        {loading ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            {children}
          </>
        ) : (
          children
        )}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
