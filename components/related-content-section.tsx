"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import type { Content } from "@/lib/types"
import { listContent } from "@/lib/pb"
import { ContentCard } from "@/components/content-card"
import { Button } from "@/components/ui/button"

type PBType = "movie" | "serie"

type Phase = "genre" | "country" | "done"

function escapePbString(value: string): string {
  return value.replaceAll('"', "\\\"")
}

function buildAnyContainsFilter(field: string, ids: string[]): string {
  const parts = ids.map((id) => id.trim()).filter(Boolean)
  if (parts.length === 0) return ""
  return parts.map((id) => `${field} ?= "${escapePbString(id)}"`).join(" || ")
}

interface RelatedContentSectionProps {
  currentImdbId: string
  pbType: PBType
  title?: string
  genreIds?: string[]
  countryIds?: string[]
  allHref: string
}

export function RelatedContentSection({
  currentImdbId,
  pbType,
  title = "More Like This",
  genreIds,
  countryIds,
  allHref,
}: RelatedContentSectionProps) {
  const pageSize = 8
  const maxItems = 32

  const [items, setItems] = useState<Content[]>([])
  const [uiPage, setUiPage] = useState(1)
  const [phase, setPhase] = useState<Phase>("genre")
  const [genrePage, setGenrePage] = useState(1)
  const [countryPage, setCountryPage] = useState(1)
  const [genreTotalPages, setGenreTotalPages] = useState<number | null>(null)
  const [countryTotalPages, setCountryTotalPages] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  const currentEscaped = useMemo(() => escapePbString(currentImdbId.trim()), [currentImdbId])

  const baseFilter = useMemo(() => {
    const baseParts: string[] = [`type="${pbType}"`, `imdb_id!="${currentEscaped}"`]
    return baseParts.join(" && ")
  }, [pbType, currentEscaped])

  const genreFilter = useMemo(() => {
    const g = buildAnyContainsFilter("genre_id", genreIds || [])
    if (!g) return ""
    return `${baseFilter} && (${g})`
  }, [baseFilter, genreIds])

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
  const canGoNext = uiPage < Math.ceil(maxItems / pageSize)

  const hasMoreGenre = genreFilter && (genreTotalPages === null || genrePage <= genreTotalPages)
  const hasMoreCountry = countryFilter && (countryTotalPages === null || countryPage <= countryTotalPages)

  const fetchNextBatch = async () => {
    if (loading) return
    if (items.length >= maxItems) {
      setPhase("done")
      return
    }

    if (phase === "done") return

    const shouldUseGenre = phase === "genre" && hasMoreGenre
    const shouldUseCountry = (phase === "country" && hasMoreCountry) || (!shouldUseGenre && hasMoreCountry)

    if (!shouldUseGenre && !shouldUseCountry) {
      setPhase("done")
      return
    }

    setLoading(true)
    try {
      const useGenre = shouldUseGenre
      const resp = await listContent({
        page: useGenre ? genrePage : countryPage,
        perPage: pageSize,
        filter: useGenre ? genreFilter : countryFilter,
        sort: "-imdb_rating",
      })

      if (useGenre) {
        setGenreTotalPages(resp.totalPages)
        setGenrePage((p) => p + 1)
      } else {
        setCountryTotalPages(resp.totalPages)
        setCountryPage((p) => p + 1)
      }

      const seen = new Set(items.map((x) => x.imdb_id))
      const next = resp.items.filter((x) => x.imdb_id && !seen.has(x.imdb_id))

      setItems((prev) => prev.concat(next).slice(0, maxItems))

      if (useGenre) {
        const noMore = resp.totalPages > 0 ? genrePage >= resp.totalPages : resp.items.length === 0
        if (noMore) setPhase(countryFilter ? "country" : "done")
      } else {
        const noMore = resp.totalPages > 0 ? countryPage >= resp.totalPages : resp.items.length === 0
        if (noMore) setPhase("done")
      }
    } finally {
      setLoading(false)
    }
  }

  const ensureLoadedForPage = async (nextUiPage: number) => {
    const needed = Math.min(maxItems, nextUiPage * pageSize)

    // load until we have enough items to fill the requested UI page, or until we are done
    while (items.length < needed && items.length < maxItems && phase !== "done") {
      // eslint-disable-next-line no-await-in-loop
      await fetchNextBatch()
    }
  }

  useEffect(() => {
    // initial load
    void ensureLoadedForPage(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!genreFilter && !countryFilter) return null

  return (
    <section className="mt-16">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl lg:text-2xl font-bold text-foreground">{title}</h2>
        <Button asChild variant="secondary">
          <Link href={allHref}>All</Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 lg:gap-6">
        {visibleItems.map((item) => (
          <ContentCard key={item.imdb_id} content={item} />
        ))}
      </div>

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
          onClick={async () => {
            const next = Math.min(Math.ceil(maxItems / pageSize), uiPage + 1)
            await ensureLoadedForPage(next)
            setUiPage(next)
          }}
        >
          Next
        </Button>
      </div>

      {loading && <div className="mt-4 text-sm text-muted-foreground">Loading…</div>}
    </section>
  )
}
