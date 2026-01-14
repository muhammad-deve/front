"use client"

import { useRef, useState, useEffect } from "react"
import type { Content } from "@/lib/types"
import { ContentCard } from "./content-card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface ContentCarouselProps {
  title: string
  items: Content[]
  className?: string
}

export function ContentCarousel({ title, items, className }: ContentCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const checkScroll = () => {
    if (!scrollRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
    setCanScrollLeft(scrollLeft > 0)
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10)
  }

  const getScrollStep = () => {
    const el = scrollRef.current
    if (!el) return 0

    const firstItem = el.querySelector<HTMLElement>("[data-carousel-item='true']")
    const style = window.getComputedStyle(el)
    const gap = Number.parseFloat(style.columnGap || style.gap || "0") || 0

    if (firstItem) return firstItem.offsetWidth + gap

    return el.clientWidth * 0.8
  }

  useEffect(() => {
    checkScroll()
    const ref = scrollRef.current
    if (!ref) return

    ref.addEventListener("scroll", checkScroll)
    window.addEventListener("resize", checkScroll)
    return () => {
      ref.removeEventListener("scroll", checkScroll)
      window.removeEventListener("resize", checkScroll)
    }
  }, [])

  useEffect(() => {
    checkScroll()
  }, [items.length])

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return

    const el = scrollRef.current
    const step = getScrollStep()
    if (!step) return

    if (direction === "right" && !canScrollRight) return
    if (direction === "left" && !canScrollLeft) return

    el.scrollBy({
      left: direction === "left" ? -step : step,
      behavior: "smooth",
    })
  }

  if (items.length === 0) return null

  return (
    <section className={cn("relative group/carousel", className)}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl lg:text-2xl font-bold text-foreground">{title}</h2>
        <div className="flex items-center gap-2 opacity-0 group-hover/carousel:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            className="w-9 h-9 rounded-full bg-secondary/80 hover:bg-secondary text-foreground disabled:opacity-30"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            className="w-9 h-9 rounded-full bg-secondary/80 hover:bg-secondary text-foreground disabled:opacity-30"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div ref={scrollRef} className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mb-4">
        {items.map((item) => (
          <div
            key={item.imdb_id}
            data-carousel-item="true"
            className="flex-shrink-0 w-[160px] sm:w-[180px] lg:w-[200px]"
          >
            <ContentCard content={item} />
          </div>
        ))}
      </div>
    </section>
  )
}
