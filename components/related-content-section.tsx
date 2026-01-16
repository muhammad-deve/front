"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import type { Content } from "@/lib/types"
import { listContent } from "@/lib/pb"
import { ContentCard } from "@/components/content-card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

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
  const pageSize = 8
  const maxItems = 32

  const [items, setItems] = useState<Content[]>([])
  const [uiPage, setUiPage] = useState(1)
  const [loading, setLoading] = useState(false)

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

  const totalUiPages = Math.max(1, Math.ceil(Math.min(maxItems, items.length) / pageSize))

  const visibleItems = useMemo(() => {
    const start = (uiPage - 1) * pageSize
    return items.slice(start, start + pageSize)
  }, [items, uiPage])

  const canGoPrev = uiPage > 1
  const canGoNext = uiPage < totalUiPages

  useEffect(() => {
    // initial load
    const key = makeCacheKey({ pbType, currentImdbId, genreIds, genreNames, countryIds, currentRating })
    const cached = relatedContentCache.get(key)
    if (cached) {
      setItems(cached)
      setUiPage(1)
      return
    }

    let cancelled = false

    setLoading(true)
    setUiPage(1)

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

  return (
    <section className="mt-16">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl lg:text-2xl font-bold text-foreground">{title}</h2>
        <Button asChild variant="secondary">
          <Link href={allHref}>All</Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 lg:gap-6">
        {loading && items.length === 0
          ? Array.from({ length: pageSize }).map((_, i) => (
            <div key={`sk-${i}`} className="rounded-xl overflow-hidden border border-border bg-card/50">
              <Skeleton className="w-full aspect-[2/3]" />
            </div>
          ))
          : visibleItems.map((item) => <ContentCard key={item.imdb_id} content={item} />)}
      </div>

      {!loading && items.length === 0 && (
        <div className="mt-6 text-sm text-muted-foreground">No similar titles found.</div>
      )}

      <div className="mt-6 flex items-center justify-between gap-4">
        <Button
          variant="outline"
          disabled={!canGoPrev}
          onClick={() => {
            const next = Math.max(1, uiPage - 1)
            setUiPage(next)
          }}
        >
          Prev
        </Button>

        <div className="text-sm text-muted-foreground">
          Page {uiPage} / {Math.max(totalUiPages, 1)}
        </div>

        <Button
          variant="outline"
          disabled={!canGoNext}
          onClick={() => {
            const next = Math.min(totalUiPages, uiPage + 1)
            setUiPage(next)
          }}
        >
          Next
        </Button>
      </div>

      {loading && items.length > 0 && <div className="mt-4 text-sm text-muted-foreground">Loading…</div>}
    </section>
  )
}
