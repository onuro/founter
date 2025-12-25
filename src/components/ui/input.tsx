import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "bg-secondary h-10 w-full min-w-0 rounded-sm px-4 py-2 text-base text-foreground transition-all outline-none md:text-sm",
        "hover:ring-white/12 hover:ring-[1.5px] hover:ring-inset",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        "placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40",
        "focus-visible:ring-[1.5px] focus-visible:ring-primary focus-visible:ring-inset focus-visible:bg-secondary",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:ring-2",
        className
      )}
      {...props}
    />
  )
}

export { Input }
