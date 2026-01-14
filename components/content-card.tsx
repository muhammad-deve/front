"use client"

import type React from "react"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import type { Content } from "@/lib/types"
import { formatRating } from "@/lib/utils"
import { Play, Plus, Check, Star } from "lucide-react"
import { useAuth } from "./auth-provider"
import { cn } from "@/lib/utils"

interface ContentCardProps {
  content: Content
  className?: string
}

export function ContentCard({ content, className }: ContentCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const { isAuthenticated, isInWatchlist, addToWatchlist, removeFromWatchlist } = useAuth()

  const inWatchlist = isInWatchlist(content.imdb_id)
  const detailUrl = content.type === "movie" ? `/movie/${content.imdb_id}` : `/series/${content.imdb_id}`

  const handleWatchlistClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isAuthenticated) {
      window.location.href = "/sign-in"
      return
    }
    if (inWatchlist) {
      removeFromWatchlist(content.imdb_id)
    } else {
      addToWatchlist(content.imdb_id)
    }
  }

  return (
    <Link
      href={detailUrl}
      className={cn(
        "group relative block rounded-xl overflow-hidden bg-card transition-all duration-300",
        isHovered && "scale-105 z-10 shadow-2xl shadow-black/50",
        className,
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Poster Image */}
      <div className="relative aspect-[2/3] overflow-hidden">
        {!imageLoaded && <div className="absolute inset-0 bg-muted animate-pulse" />}
        <Image
          src={content.primaryImage?.url || "/placeholder.svg?height=600&width=400&query=movie poster"}
          alt={content.title}
          fill
          className={cn(
            "object-cover transition-all duration-500",
            isHovered && "scale-110",
            imageLoaded ? "opacity-100" : "opacity-0",
          )}
          onLoad={() => setImageLoaded(true)}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
        />

        {/* Quality Badge */}
        {content.quality && (
          <div className="absolute top-2 left-2 px-2 py-0.5 bg-background/80 backdrop-blur-sm rounded text-xs font-semibold text-foreground">
            {content.quality}
          </div>
        )}

        {/* Type Badge */}
        <div className="absolute top-2 right-2 px-2 py-0.5 bg-primary/90 backdrop-blur-sm rounded text-xs font-semibold text-primary-foreground uppercase">
          {content.type === "tv" ? "Series" : "Movie"}
        </div>

        {/* Hover Overlay */}
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-0 transition-opacity duration-300",
            isHovered && "opacity-100",
          )}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center transform scale-0 group-hover:scale-100 transition-transform duration-300">
              <Play className="w-7 h-7 text-primary-foreground fill-primary-foreground ml-1" />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="absolute bottom-4 left-4 right-4">
            <h3 className="text-foreground font-semibold text-sm mb-1 line-clamp-2">{content.title}</h3>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {content.startYear && <span>{content.startYear}</span>}
              {content.rating && (
                <span className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-primary fill-primary" />
                  {formatRating(content.rating.aggregateRating)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add to Watchlist Button */}
      <button
        onClick={handleWatchlistClick}
        className={cn(
          "absolute top-12 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100",
          inWatchlist
            ? "bg-primary text-primary-foreground"
            : "bg-background/80 backdrop-blur-sm text-foreground hover:bg-primary hover:text-primary-foreground",
        )}
      >
        {inWatchlist ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
      </button>

      {/* Card Info (Below Image) */}
      <div className="p-3">
        <h3 className="text-foreground font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors">
          {content.title}
        </h3>
        <div className="flex items-center justify-between mt-1">
          <span className="text-muted-foreground text-xs">{content.startYear}</span>
          {content.rating && (
            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-primary/20 rounded">
              <Star className="w-3 h-3 text-primary fill-primary" />
              <span className="text-xs font-semibold text-primary">{formatRating(content.rating.aggregateRating)}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
