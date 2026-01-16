"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import type { Content } from "@/lib/types"
import { formatRuntime, formatRating, formatVoteCount, cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Play, Plus, Check, Star, Info } from "lucide-react"
import { useAuth } from "./auth-provider"

interface HeroSectionProps {
  content: Content
  featuredItems?: Content[]
}

export function HeroSection({ content, featuredItems = [] }: HeroSectionProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [imageLoaded, setImageLoaded] = useState(false)
  const { isAuthenticated, isInWatchlist, addToWatchlist, removeFromWatchlist } = useAuth()

  const allItems = [content, ...featuredItems].slice(0, 5)
  const activeContent = allItems[activeIndex]
  const inWatchlist = isInWatchlist(activeContent.imdb_id)

  useEffect(() => {
    if (allItems.length <= 1) return
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % allItems.length)
    }, 8000)
    return () => clearInterval(interval)
  }, [allItems.length])

  const handleWatchlistClick = async () => {
    if (!isAuthenticated) {
      window.location.href = "/sign-in"
      return
    }
    if (inWatchlist) {
      await removeFromWatchlist(activeContent.imdb_id)
    } else {
      await addToWatchlist(activeContent.imdb_id)
    }
  }

  const detailUrl =
    activeContent.type === "movie" ? `/movie/${activeContent.imdb_id}` : `/series/${activeContent.imdb_id}`

  return (
    <section className="relative h-[70vh] lg:h-[85vh] overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        {!imageLoaded && <div className="absolute inset-0 bg-muted animate-pulse" />}
        <Image
          src={
            activeContent.backdropImage?.url ||
            activeContent.primaryImage?.url ||
            "/placeholder.svg?height=1080&width=1920&query=cinematic movie scene dark"
          }
          alt={activeContent.title}
          fill
          priority
          className={cn("object-cover transition-opacity duration-700", imageLoaded ? "opacity-100" : "opacity-0")}
          onLoad={() => setImageLoaded(true)}
        />
        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative h-full container mx-auto px-4 flex items-center">
        <div className="max-w-2xl pt-20 lg:pt-0">
          {/* Type Badge */}
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded uppercase">
              {activeContent.type === "tv" ? "TV Series" : "Movie"}
            </span>
            {activeContent.quality && (
              <span className="px-3 py-1 bg-secondary text-foreground text-xs font-bold rounded">
                {activeContent.quality}
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-4 text-balance">{activeContent.title}</h1>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-4">
            {activeContent.rating && (
              <div className="flex items-center gap-1.5 px-2 py-1 bg-primary/20 rounded">
                <Star className="w-4 h-4 text-primary fill-primary" />
                <span className="font-bold text-primary">{formatRating(activeContent.rating.aggregateRating)}</span>
                <span className="text-xs text-muted-foreground">
                  ({formatVoteCount(activeContent.rating.voteCount)})
                </span>
              </div>
            )}
            {activeContent.startYear && <span>{activeContent.startYear}</span>}
            {activeContent.runtimeSeconds && <span>{formatRuntime(activeContent.runtimeSeconds)}</span>}
          </div>

          {/* Genres */}
          <div className="flex flex-wrap gap-2 mb-6">
            {activeContent.genres.slice(0, 4).map((genre) => (
              <span key={genre} className="px-3 py-1 bg-secondary/80 text-foreground text-sm rounded-full">
                {genre}
              </span>
            ))}
          </div>

          {/* Plot */}
          <p className="text-muted-foreground text-base lg:text-lg mb-8 line-clamp-3 max-w-xl">{activeContent.plot}</p>

          {/* Cast Avatars */}
          {activeContent.stars && activeContent.stars.length > 0 && (
            <div className="flex items-center gap-3 mb-8">
              <div className="flex -space-x-2">
                {activeContent.stars.slice(0, 4).map((star) => (
                  <div key={star.id} className="w-10 h-10 rounded-full border-2 border-background overflow-hidden">
                    <Image
                      src={star.primaryImage?.url || "/placeholder.svg?height=100&width=100&query=actor portrait"}
                      alt={star.displayName}
                      width={40}
                      height={40}
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {activeContent.stars
                  .slice(0, 2)
                  .map((s) => s.displayName)
                  .join(", ")}
                {activeContent.stars.length > 2 && ` +${activeContent.stars.length - 2}`}
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-4">
            <Button
              asChild
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-8"
            >
              <Link href={detailUrl}>
                <Play className="w-5 h-5 mr-2 fill-current" />
                Watch Now
              </Link>
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={handleWatchlistClick}
              className="bg-secondary/80 hover:bg-secondary text-foreground font-semibold px-6"
            >
              {inWatchlist ? (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  In My List
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5 mr-2" />
                  My List
                </>
              )}
            </Button>
            <Button variant="ghost" size="lg" asChild className="text-muted-foreground hover:text-foreground">
              <Link href={detailUrl}>
                <Info className="w-5 h-5 mr-2" />
                More Info
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Slide Indicators */}
      {allItems.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2">
          {allItems.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className={cn(
                "h-1 rounded-full transition-all duration-300",
                index === activeIndex ? "w-8 bg-primary" : "w-4 bg-muted-foreground/40 hover:bg-muted-foreground/60",
              )}
            />
          ))}
        </div>
      )}
    </section>
  )
}
