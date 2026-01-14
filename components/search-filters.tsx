"use client"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { X } from "lucide-react"

interface SearchFiltersProps {
  genres: string[]
  filters: {
    type: string
    genre: string
    year: [number, number]
    rating: number
    sortBy: string
  }
  onFilterChange: (key: string, value: string | number | [number, number]) => void
  onReset: () => void
}

export function SearchFilters({ genres, filters, onFilterChange, onReset }: SearchFiltersProps) {
  const currentYear = new Date().getFullYear()

  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-foreground">Filters</h2>
        <Button variant="ghost" size="sm" onClick={onReset} className="text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4 mr-1" />
          Reset
        </Button>
      </div>

      {/* Type Filter */}
      <div className="space-y-2">
        <Label className="text-foreground">Type</Label>
        <Select value={filters.type} onValueChange={(value) => onFilterChange("type", value)}>
          <SelectTrigger className="bg-secondary border-border">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="movie">Movies</SelectItem>
            <SelectItem value="tv">TV Series</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Genre Filter */}
      <div className="space-y-2">
        <Label className="text-foreground">Genre</Label>
        <Select value={filters.genre} onValueChange={(value) => onFilterChange("genre", value)}>
          <SelectTrigger className="bg-secondary border-border">
            <SelectValue placeholder="All Genres" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all">All Genres</SelectItem>
            {genres.map((genre: string) => (
              <SelectItem key={genre} value={genre.toLowerCase()}>
                {genre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Year Range */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-foreground">Year Range</Label>
          <span className="text-sm text-muted-foreground">
            {filters.year[0]} - {filters.year[1]}
          </span>
        </div>
        <Slider
          value={filters.year}
          min={1980}
          max={currentYear}
          step={1}
          onValueChange={(value) => onFilterChange("year", value as [number, number])}
          className="py-2"
        />
      </div>

      {/* Minimum Rating */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-foreground">Minimum Rating</Label>
          <span className="text-sm text-primary font-medium">{filters.rating.toFixed(1)}+</span>
        </div>
        <Slider
          value={[filters.rating]}
          min={0}
          max={10}
          step={0.5}
          onValueChange={([value]) => onFilterChange("rating", value)}
          className="py-2"
        />
      </div>

      {/* Sort By */}
      <div className="space-y-2">
        <Label className="text-foreground">Sort By</Label>
        <Select value={filters.sortBy} onValueChange={(value) => onFilterChange("sortBy", value)}>
          <SelectTrigger className="bg-secondary border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="popularity">Popularity</SelectItem>
            <SelectItem value="rating">Rating</SelectItem>
            <SelectItem value="year">Year</SelectItem>
            <SelectItem value="title">Title (A-Z)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
