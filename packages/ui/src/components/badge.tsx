import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "../lib/utils";

const badgeVariants = cva("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", {
  variants: {
    variant: {
      default: "bg-zinc-100 text-zinc-700",
      low: "bg-blue-50 text-blue-700",
      medium: "bg-yellow-50 text-yellow-700",
      high: "bg-red-50 text-red-700",
      todo: "bg-zinc-100 text-zinc-500",
      in_progress: "bg-indigo-50 text-indigo-700",
      done: "bg-green-50 text-green-700",
    },
  },
  defaultVariants: { variant: "default" },
});

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, className }))} {...props} />;
}

export { Badge, badgeVariants };
