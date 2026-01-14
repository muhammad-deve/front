"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ContentCard } from "@/components/content-card"
import { SearchFilters } from "@/components/search-filters"
import { listContent, listGenres } from "@/lib/pb"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Grid, List, SlidersHorizontal, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Content } from "@/lib/types"

const defaultFilters = {
  type: "all",
  genre: "all",
  year: [1980, new Date().getFullYear()] as [number, number],
  rating: 0,
  sortBy: "popularity",
}

function SearchContent() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get("q") || ""

  const [query, setQuery] = useState(initialQuery)
  const [filters, setFilters] = useState(defaultFilters)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [showFilters, setShowFilters] = useState(false)
	const [results, setResults] = useState<Content[]>([])
	const [totalItems, setTotalItems] = useState(0)
	const [isLoading, setIsLoading] = useState(false)
	const [genres, setGenres] = useState<Array<{ id: string; name: string }>>([])

  useEffect(() => {
    setQuery(initialQuery)
  }, [initialQuery])

	useEffect(() => {
		let cancelled = false
		listGenres()
			.then((g) => {
				if (cancelled) return
				setGenres(g)
			})
			.catch(() => {
				if (cancelled) return
				setGenres([])
			})
		return () => {
			cancelled = true
		}
	}, [])

	useEffect(() => {
		let cancelled = false
		const q = query.trim()
		const parts: string[] = []
		if (q) {
			const escaped = q.replaceAll('"', "\\\"")
			parts.push(`(title ~ "${escaped}" || plot ~ "${escaped}")`)
		}
		if (filters.type === "movie") {
			parts.push('type="movie"')
		} else if (filters.type === "tv") {
			parts.push('type="serie"')
		}
		if (filters.year?.length === 2) {
			parts.push(`released_year >= ${filters.year[0]} && released_year <= ${filters.year[1]}`)
		}
		if (filters.rating > 0) {
			parts.push(`imdb_rating >= ${filters.rating}`)
		}
		if (filters.genre !== "all") {
			const gid = genres.find((g) => g.name.toLowerCase() === filters.genre)?.id
			if (gid) {
				parts.push(`genre_id ?= "${gid}"`)
			}
		}
		const filter = parts.join(" && ")

		let sort = "-vote_count"
		switch (filters.sortBy) {
			case "rating":
				sort = "-imdb_rating"
				break
			case "year":
				sort = "-released_year"
				break
			case "title":
				sort = "title"
				break
			case "popularity":
			default:
				sort = "-vote_count"
		}

		setIsLoading(true)
		listContent({ page: 1, perPage: 120, filter: filter || undefined, sort })
			.then((resp) => {
				if (cancelled) return
				setResults(resp.items)
				setTotalItems(resp.totalItems)
			})
			.catch(() => {
				if (cancelled) return
				setResults([])
				setTotalItems(0)
			})
			.finally(() => {
				if (cancelled) return
				setIsLoading(false)
			})

		return () => {
			cancelled = true
		}
	}, [query, filters, genres])

  const handleFilterChange = (key: string, value: string | number | [number, number]) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const resetFilters = () => {
    setFilters(defaultFilters)
  }

  return (
    <div className="container mx-auto px-4 pt-24 lg:pt-32 pb-8">
      {/* Search Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-4">Search</h1>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search movies, series, genres..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-12 h-12 bg-secondary border-border focus:ring-primary text-lg"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" className="lg:hidden" onClick={() => setShowFilters(!showFilters)}>
              <SlidersHorizontal className="w-5 h-5 mr-2" />
              Filters
            </Button>
            <div className="flex items-center border border-border rounded-lg overflow-hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode("grid")}
                className={cn("rounded-none", viewMode === "grid" && "bg-secondary")}
              >
                <Grid className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode("list")}
                className={cn("rounded-none", viewMode === "list" && "bg-secondary")}
              >
                <List className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar */}
        <aside className={cn("w-full lg:w-72 flex-shrink-0", showFilters ? "block" : "hidden lg:block")}>
          <SearchFilters genres={genres.map((g) => g.name)} filters={filters} onFilterChange={handleFilterChange} onReset={resetFilters} />
        </aside>

        {/* Results */}
        <div className="flex-1">
          {/* Results Count */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-muted-foreground">
              {isLoading ? "Loading..." : `${totalItems} result${totalItems !== 1 ? "s" : ""} found`}
              {query && (
                <>
                  {" "}
                  for <span className="text-foreground font-medium">&quot;{query}&quot;</span>
                </>
              )}
            </p>
          </div>

          {/* Results Grid/List */}
          {!isLoading && results.length > 0 ? (
            <div
              className={cn(
                viewMode === "grid" ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 lg:gap-6" : "space-y-4",
              )}
            >
              {results.map((item) => (
                <ContentCard key={item.imdb_id} content={item} />
              ))}
            </div>
          ) : isLoading ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          ) : (
            <div className="text-center py-16">
              <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">No results found</h2>
              <p className="text-muted-foreground mb-4">Try adjusting your search or filters</p>
              <Button variant="secondary" onClick={resetFilters}>
                Reset Filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <Suspense
        fallback={
          <div className="container mx-auto px-4 pt-24 lg:pt-32 pb-8">
            <div className="animate-pulse space-y-4">
              <div className="h-12 bg-muted rounded-lg w-full" />
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="aspect-[2/3] bg-muted rounded-xl" />
                ))}
              </div>
            </div>
          </div>
        }
      >
        <SearchContent />
      </Suspense>
      <Footer />
    </main>
  )
}
