"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import type { Content } from "@/lib/types"
import { listContent } from "@/lib/pb"
import { ContentCard } from "@/components/content-card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ChevronLeft, ChevronRight } from "lucide-react"

type PBType = "movie" | "serie"

function escapePbString(value: string): string {
  return value.replaceAll('"', "\\\"")
}

function buildAnyContainsFilter(field: string, ids: string[]): string {
  const parts = ids.map((id) => id.trim()).filter(Boolean)
  if (parts.length === 0) return ""
  return parts.map((id) => `${field} ?= "${escapePbString(id)}"`).join(" || ")
}

function buildGenreNameFilter(genreNames: string[]): string {
  const names = genreNames.map((n) => n.trim()).filter(Boolean)
  if (names.length === 0) return ""
  // Use expanded genre_id.name to filter by genre name
  return names.map((name) => `genre_id.name ~ "${escapePbString(name)}"`).join(" || ")
}

const relatedContentCache = new Map<string, Content[]>()

function makeCacheKey(opts: {
  pbType: PBType
  currentImdbId: string
  genreIds?: string[]
  genreNames?: string[]
  countryIds?: string[]
  currentRating?: number
}): string {
  const g = (opts.genreIds || []).map((x) => x.trim()).filter(Boolean).sort().join(",")
  const gn = (opts.genreNames || []).map((x) => x.trim().toLowerCase()).filter(Boolean).sort().join(",")
  const c = (opts.countryIds || []).map((x) => x.trim()).filter(Boolean).sort().join(",")
  const r = typeof opts.currentRating === "number" && Number.isFinite(opts.currentRating) ? opts.currentRating : ""
  return `${opts.pbType}|${opts.currentImdbId.trim()}|g:${g}|gn:${gn}|c:${c}|r:${r}`
}

interface RelatedContentSectionProps {
  currentImdbId: string
  pbType: PBType
  title?: string
  genreIds?: string[]
  genreNames?: string[]
  countryIds?: string[]
  currentRating?: number
  allHref: string
}

export function RelatedContentSection({
  currentImdbId,
  pbType,
  title = "More Like This",
  genreIds,
  genreNames,
  countryIds,
  currentRating,
  allHref,
}: RelatedContentSectionProps) {
  const maxItems = 32

  const [items, setItems] = useState<Content[]>([])
  const [loading, setLoading] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const baseItems = useMemo(() => items.slice(0, maxItems), [items])

  const loopItems = useMemo(() => {
    if (baseItems.length === 0) return []
    // 3 copies so we can keep the scroll position in the middle copy and jump seamlessly.
    return [...baseItems, ...baseItems, ...baseItems]
  }, [baseItems])

  const currentEscaped = useMemo(() => escapePbString(currentImdbId.trim()), [currentImdbId])

  const baseFilter = useMemo(() => {
    const baseParts: string[] = [`type="${pbType}"`, `imdb_id!="${currentEscaped}"`]
    return baseParts.join(" && ")
  }, [pbType, currentEscaped])

  const genreFilter = useMemo(() => {
    // First try genreIds, then fall back to genreNames
    const g = buildAnyContainsFilter("genre_id", genreIds || [])
    if (g) return `${baseFilter} && (${g})`

    // Fallback to genre names filter if genreIds is empty
    const gn = buildGenreNameFilter(genreNames || [])
    if (gn) return `${baseFilter} && (${gn})`

    return ""
  }, [baseFilter, genreIds, genreNames])

  const countryFilter = useMemo(() => {
    const c = buildAnyContainsFilter("country_id", countryIds || [])
    if (!c) return ""
    return `${baseFilter} && (${c})`
  }, [baseFilter, countryIds])

  const getOneSetWidth = (el: HTMLDivElement) => {
    if (baseItems.length === 0) return 0
    const w = el.scrollWidth / 3
    return Number.isFinite(w) && w > 0 ? w : 0
  }

  const normalizeLoopScroll = (el: HTMLDivElement) => {
    if (baseItems.length === 0) return
    const setWidth = getOneSetWidth(el)
    if (!setWidth) return

    // If user reaches either end, jump to the equivalent position in the middle copy.
    const threshold = 40
    if (el.scrollLeft < threshold) {
      el.scrollLeft = el.scrollLeft + setWidth
    } else if (el.scrollLeft > setWidth * 2 - threshold) {
      el.scrollLeft = el.scrollLeft - setWidth
    }
  }

  const checkScroll = () => {
    const el = scrollRef.current
    if (!el) return

    normalizeLoopScroll(el)
    // Buttons should not "end"; keep them enabled whenever we have items.
    const hasItems = baseItems.length > 0
    setCanScrollLeft(hasItems)
    setCanScrollRight(hasItems)
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
    // initial load
    const key = makeCacheKey({ pbType, currentImdbId, genreIds, genreNames, countryIds, currentRating })
    const cached = relatedContentCache.get(key)
    if (cached) {
      setItems(cached)
      return
    }

    let cancelled = false

    setLoading(true)

    const run = async () => {
      const out: Content[] = []
      const seen = new Set<string>()

      const appendFromFilter = async (filter: string, sort = "-imdb_rating") => {
        if (!filter) return
        const resp = await listContent({
          page: 1,
          perPage: maxItems,
          filter,
          sort,
        })

        for (const item of resp.items) {
          if (out.length >= maxItems) break
          if (!item.imdb_id) continue
          if (seen.has(item.imdb_id)) continue
          seen.add(item.imdb_id)
          out.push(item)
        }
      }

      // load until we have enough items to fill the requested UI page, or until we are done
      if (genreFilter) await appendFromFilter(genreFilter)
      if (countryFilter && out.length < maxItems) await appendFromFilter(countryFilter)

      // Fallback: similar IMDb rating (within widening ranges)
      if (out.length < maxItems && typeof currentRating === "number" && Number.isFinite(currentRating) && currentRating > 0) {
        const base = currentRating
        const deltas = [0.3, 0.6, 1.0, 1.5]

        for (const d of deltas) {
          if (out.length >= maxItems) break
          const min = Math.max(0, +(base - d).toFixed(1))
          const max = Math.min(10, +(base + d).toFixed(1))
          const ratingFilter = `${baseFilter} && imdb_rating>0 && imdb_rating>=${min} && imdb_rating<=${max}`
          await appendFromFilter(ratingFilter)
        }
      }

      // Final fallback: top-rated titles of same type (never empty unless PB itself is empty)
      if (out.length < maxItems) {
        const topRatedFilter = `${baseFilter} && imdb_rating>0`
        await appendFromFilter(topRatedFilter)
      }

      if (cancelled) return
      relatedContentCache.set(key, out)
      setItems(out)
    }

    run()
      .catch(() => {
        if (!cancelled) setItems([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [baseFilter, countryFilter, countryIds, currentImdbId, currentRating, genreFilter, genreIds, genreNames, pbType])

  useEffect(() => {
    checkScroll()

    const ref = scrollRef.current
    if (!ref) return

    ref.addEventListener("scroll", checkScroll)

    const onResize = () => {
      const el = scrollRef.current
      if (!el) return
      if (baseItems.length === 0) return
      const setWidth = getOneSetWidth(el)
      if (!setWidth) return
      // Keep user in the middle copy on resize.
      el.scrollLeft = setWidth + (el.scrollLeft % setWidth)
      checkScroll()
    }

    window.addEventListener("resize", onResize)
    return () => {
      ref.removeEventListener("scroll", checkScroll)
      window.removeEventListener("resize", onResize)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseItems.length])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    if (baseItems.length === 0) return

    // Start at the middle copy so user can scroll left/right immediately.
    requestAnimationFrame(() => {
      const setWidth = getOneSetWidth(el)
      if (setWidth) el.scrollLeft = setWidth
      checkScroll()
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseItems.length])

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current
    if (!el) return

    const step = getScrollStep()
    if (!step) return

    if (direction === "right" && !canScrollRight) return
    if (direction === "left" && !canScrollLeft) return

    el.scrollBy({
      left: direction === "left" ? -step : step,
      behavior: "smooth",
    })
  }

  return (
    <section className="mt-16">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl lg:text-2xl font-bold text-foreground">{title}</h2>
        <div className="flex items-center gap-2">
          <Button asChild variant="secondary">
            <Link href={allHref}>All</Link>
          </Button>
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
        {loading && items.length === 0
          ? Array.from({ length: 10 }).map((_, i) => (
            <div
              key={`sk-${i}`}
              data-carousel-item="true"
              className="flex-shrink-0 w-[160px] sm:w-[180px] lg:w-[200px]"
            >
              <div className="rounded-xl overflow-hidden border border-border bg-card/50">
                <Skeleton className="w-full aspect-[2/3]" />
                <div className="p-3">
                  <Skeleton className="h-4 w-3/4" />
                  <div className="mt-2 flex items-center justify-between">
                    <Skeleton className="h-3 w-10" />
                    <Skeleton className="h-4 w-10" />
                  </div>
                </div>
              </div>
            </div>
          ))
          : loopItems.map((item, idx) => (
            <div
              key={`${item.imdb_id}-${idx}`}
              data-carousel-item="true"
              className="flex-shrink-0 w-[160px] sm:w-[180px] lg:w-[200px]"
            >
              <ContentCard content={item} />
            </div>
          ))}
      </div>

      {!loading && items.length === 0 && (
        <div className="mt-6 text-sm text-muted-foreground">No similar titles found.</div>
      )}

      {loading && items.length > 0 && <div className="mt-4 text-sm text-muted-foreground">Loading…</div>}
    </section>
  )
}
