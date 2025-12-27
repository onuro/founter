"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cva } from "class-variance-authority"

import { cn } from "@/lib/utils"

const tabsListVariants = cva(
  "relative bg-secondary text-muted-foreground inline-flex w-full items-center justify-center rounded-md gap-1",
  {
    variants: {
      size: {
        default: "p-1",
        sm: "p-1",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

const tabsTriggerVariants = cva(
  [
    "relative z-10 inline-flex flex-1 items-center justify-center rounded-sm font-semibold uppercase tracking-wider transition-colors duration-200",
    "text-muted-foreground hover:text-foreground",
    "data-[state=active]:text-foreground",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ],
  {
    variants: {
      size: {
        default: "px-3 py-3 text-xs",
        sm: "px-2 py-1.5 text-[12px]",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

type TabsSize = "default" | "sm"

const TabsSizeContext = React.createContext<TabsSize>("default")

interface TabsProps extends React.ComponentProps<typeof TabsPrimitive.Root> {
  size?: TabsSize
}

function Tabs({
  className,
  size = "default",
  ...props
}: TabsProps) {
  return (
    <TabsSizeContext.Provider value={size}>
      <TabsPrimitive.Root
        data-slot="tabs"
        className={cn("flex flex-col gap-3", className)}
        {...props}
      />
    </TabsSizeContext.Provider>
  )
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  const size = React.useContext(TabsSizeContext)
  const [activeTabRect, setActiveTabRect] = React.useState<{
    left: number
    top: number
    width: number
    height: number
  } | null>(null)

  const listRef = React.useRef<HTMLDivElement>(null)

  const updateActiveTab = React.useCallback(() => {
    const activeTab = listRef.current?.querySelector('[data-state="active"]')
    if (activeTab && listRef.current) {
      const listRect = listRef.current.getBoundingClientRect()
      const tabRect = activeTab.getBoundingClientRect()

      setActiveTabRect({
        left: tabRect.left - listRect.left,
        top: tabRect.top - listRect.top,
        width: tabRect.width,
        height: tabRect.height,
      })
    }
  }, [])

  React.useEffect(() => {
    updateActiveTab()

    // Observer for tab state changes
    const observer = new MutationObserver(updateActiveTab)
    if (listRef.current) {
      observer.observe(listRef.current, {
        attributes: true,
        subtree: true,
        attributeFilter: ['data-state'],
      })
    }

    // Update on window resize
    window.addEventListener('resize', updateActiveTab)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', updateActiveTab)
    }
  }, [updateActiveTab])

  return (
    <TabsPrimitive.List
      ref={listRef}
      data-slot="tabs-list"
      className={cn(tabsListVariants({ size }), className)}
      {...props}
    >
      {activeTabRect && (
        <span
          className="absolute z-0 rounded-sm bg-neutral-800/75 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] transition-all duration-300 ease-out pointer-events-none"
          style={{
            left: `${activeTabRect.left}px`,
            top: `${activeTabRect.top}px`,
            width: `${activeTabRect.width}px`,
            height: `${activeTabRect.height}px`,
          }}
        />
      )}
      {props.children}
    </TabsPrimitive.List>
  )
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  const size = React.useContext(TabsSizeContext)
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(tabsTriggerVariants({ size }), className)}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
