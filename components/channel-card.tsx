"use client"

import { useState } from "react"
import Image from "next/image"
import type { Channel } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Play, Radio } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ChannelCardProps {
  channel: Channel
  onWatch: (channel: Channel) => void
}

export function ChannelCard({ channel, onWatch }: ChannelCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imgSrc, setImgSrc] = useState<string>(
    channel.isLogoAvailable === false
      ? "https://static.thenounproject.com/png/4180653-512.png"
      : channel.logo || "/placeholder.svg?height=180&width=320&query=tv channel logo",
  )

  return (
    <div
      className={cn(
        "relative group rounded-xl overflow-hidden bg-card border border-border transition-all duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        isHovered && "scale-105 shadow-2xl shadow-primary/10 border-primary/50",
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onWatch(channel)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onWatch(channel)
        }
      }}
      role="button"
      tabIndex={0}
    >
      {/* Live Badge */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-2 py-1 bg-destructive text-destructive-foreground text-xs font-bold rounded">
        <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
        LIVE
      </div>

      {/* Quality Badge */}
      {channel.quality && (
        <div className="absolute top-3 right-3 z-10 px-2 py-1 bg-background/80 backdrop-blur-sm text-foreground text-xs font-bold rounded">
          {channel.quality}
        </div>
      )}

      {/* Channel Logo/Image */}
      <div className="aspect-video relative bg-muted">
        {!imageLoaded && <div className="absolute inset-0 bg-muted animate-pulse" />}
        <Image
          src={imgSrc}
          alt={channel.name}
          fill
          className={cn(
            "object-cover transition-all duration-500",
            isHovered && "scale-110 brightness-75",
            imageLoaded ? "opacity-100" : "opacity-0",
          )}
          onLoad={() => setImageLoaded(true)}
          onError={() => {
            setImageLoaded(true)
            setImgSrc("https://static.thenounproject.com/png/4180653-512.png")
          }}
        />

        {/* Hover Overlay */}
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity duration-300",
            isHovered && "opacity-100",
          )}
        >
          <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center transform scale-0 group-hover:scale-100 transition-transform duration-300">
            <Play className="w-7 h-7 text-primary-foreground fill-primary-foreground ml-1" />
          </div>
        </div>
      </div>

      {/* Channel Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{channel.name}</h3>
            {channel.category && <p className="text-sm text-muted-foreground">{channel.category}</p>}
				{(channel.country || channel.language) && (
					<p className="text-sm text-muted-foreground">
						{[channel.country, channel.language]
							.filter((v): v is string => Boolean(v))
							.join(" • ")}
					</p>
				)}
          </div>
          <Radio className="w-5 h-5 text-primary flex-shrink-0" />
        </div>
        <Button
          onClick={(e) => {
            e.stopPropagation()
            onWatch(channel)
          }}
          className="w-full mt-3 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Watch Live
        </Button>
      </div>
    </div>
  )
}
