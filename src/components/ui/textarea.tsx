import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "bg-secondary shadow-inset-frame min-h-16 w-full min-w-0 rounded-sm px-4 py-2 text-base text-foreground transition-all duration-400 outline-none md:text-sm",
        "hover:ring-white/12 hover:ring-[1.5px] hover:ring-inset",
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

export { Textarea }
