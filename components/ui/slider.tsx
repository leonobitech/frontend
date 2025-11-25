"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

interface SliderProps extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  active?: boolean
  variant?: "blue" | "white"
  size?: "sm" | "md"
}

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SliderProps
>(({ className, active = true, variant = "blue", size = "md", ...props }, ref) => {
  const trackHeight = size === "md" ? "h-1.5" : "h-1"
  const thumbActiveSize = size === "md" ? "h-3 w-3" : "h-2.5 w-2.5"
  const thumbInactiveSize = size === "md" ? "h-2.5 w-2.5" : "h-2 w-2"

  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn(
        "relative flex w-full touch-none select-none items-center",
        className
      )}
      {...props}
    >
      <SliderPrimitive.Track className={cn(
        `relative ${trackHeight} w-full grow rounded-full border transition-all duration-300`,
        active
          ? "bg-gradient-to-r from-slate-900/90 via-slate-800/90 to-slate-900/90 border-slate-700/40 shadow-[inset_0_1px_3px_rgba(0,0,0,0.5),0_0_10px_rgba(59,130,246,0.3),0_0_20px_rgba(59,130,246,0.15)]"
          : "bg-slate-800/50 border-slate-700/30"
      )}>
        <SliderPrimitive.Range className={cn(
          "absolute h-full rounded-full transition-all duration-300",
          active
            ? "bg-blue-400 shadow-[0_0_15px_rgba(59,130,246,1),0_0_30px_rgba(59,130,246,0.8),0_0_50px_rgba(59,130,246,0.5),inset_0_1px_2px_rgba(147,197,253,0.9)]"
            : "bg-slate-600/40"
        )} />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className={cn(
        "block rounded-full transition-all duration-300 hover:scale-125 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:pointer-events-none disabled:opacity-50",
        active
          ? `${thumbActiveSize} bg-gradient-to-br from-blue-300 via-blue-400 to-blue-300 border-2 border-blue-300 shadow-[0_0_20px_rgba(59,130,246,1),0_0_35px_rgba(59,130,246,0.7),0_0_50px_rgba(59,130,246,0.4),inset_0_1px_3px_rgba(147,197,253,1)] hover:shadow-[0_0_25px_rgba(59,130,246,1),0_0_45px_rgba(59,130,246,0.9),0_0_60px_rgba(59,130,246,0.5)] focus-visible:ring-blue-400/60`
          : `${thumbInactiveSize} border-2 border-slate-600/50 bg-slate-700/60`
      )} />
    </SliderPrimitive.Root>
  )
})
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
