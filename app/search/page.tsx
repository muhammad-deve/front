"use client"

import { useState, useMemo, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ContentCard } from "@/components/content-card"
import { SearchFilters } from "@/components/search-filters"
import { allContent } from "@/lib/mock-data"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Grid, List, SlidersHorizontal, X } from "lucide-react"
import { cn } from "@/lib/utils"

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

  useEffect(() => {
    setQuery(initialQuery)
  }, [initialQuery])

  const handleFilterChange = (key: string, value: string | number | [number, number]) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const resetFilters = () => {
    setFilters(defaultFilters)
  }

  const filteredResults = useMemo(() => {
    let results = [...allContent]

    // Search query
    if (query) {
      const lowerQuery = query.toLowerCase()
      results = results.filter(
        (item) =>
          item.title.toLowerCase().includes(lowerQuery) ||
          item.genres.some((g) => g.toLowerCase().includes(lowerQuery)) ||
          item.plot?.toLowerCase().includes(lowerQuery),
      )
    }

    // Type filter
    if (filters.type !== "all") {
      results = results.filter((item) => item.type === filters.type)
    }

    // Genre filter
    if (filters.genre !== "all") {
      results = results.filter((item) => item.genres.some((g) => g.toLowerCase() === filters.genre))
    }

    // Year filter
    results = results.filter((item) => {
      const year = item.startYear || 0
      return year >= filters.year[0] && year <= filters.year[1]
    })

    // Rating filter
    if (filters.rating > 0) {
      results = results.filter((item) => (item.rating?.aggregateRating || 0) >= filters.rating)
    }

    // Sort
    switch (filters.sortBy) {
      case "rating":
        results.sort((a, b) => (b.rating?.aggregateRating || 0) - (a.rating?.aggregateRating || 0))
        break
      case "year":
        results.sort((a, b) => (b.startYear || 0) - (a.startYear || 0))
        break
      case "title":
        results.sort((a, b) => a.title.localeCompare(b.title))
        break
      case "popularity":
      default:
        results.sort((a, b) => (b.rating?.voteCount || 0) - (a.rating?.voteCount || 0))
    }

    return results
  }, [query, filters])

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
          <SearchFilters filters={filters} onFilterChange={handleFilterChange} onReset={resetFilters} />
        </aside>

        {/* Results */}
        <div className="flex-1">
          {/* Results Count */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-muted-foreground">
              {filteredResults.length} result{filteredResults.length !== 1 ? "s" : ""} found
              {query && (
                <>
                  {" "}
                  for <span className="text-foreground font-medium">&quot;{query}&quot;</span>
                </>
              )}
            </p>
          </div>

          {/* Results Grid/List */}
          {filteredResults.length > 0 ? (
            <div
              className={cn(
                viewMode === "grid" ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 lg:gap-6" : "space-y-4",
              )}
            >
              {filteredResults.map((item) => (
                <ContentCard key={item.imdb_id} content={item} />
              ))}
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
