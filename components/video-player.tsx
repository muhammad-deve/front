"use client"

import { useState } from "react"
import type { VideoSources } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { Maximize, Server, AlertCircle } from "lucide-react"

interface VideoPlayerProps {
  sources: VideoSources
  title: string
}

type ServerKey = keyof VideoSources

const serverNames: Record<ServerKey, string> = {
  autoembed_url: "AutoEmbed",
  gomo_url: "Gomo",
  moviesapi_url: "MoviesAPI",
  vidlink_pro_url: "VidLink Pro",
  vidsrc_url: "VidSrc",
}

export function VideoPlayer({ sources, title }: VideoPlayerProps) {
  const availableServers = Object.entries(sources).filter(([, url]) => url) as [ServerKey, string][]
  const [activeServer, setActiveServer] = useState<ServerKey>(availableServers[0]?.[0] || "vidsrc_url")
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [hasError, setHasError] = useState(false)

  const currentUrl = sources[activeServer]

  const handleFullscreen = () => {
    const iframe = document.querySelector("#video-iframe") as HTMLIFrameElement
    if (iframe) {
      if (document.fullscreenElement) {
        document.exitFullscreen()
        setIsFullscreen(false)
      } else {
        iframe.requestFullscreen()
        setIsFullscreen(true)
      }
    }
  }

  if (availableServers.length === 0) {
    return (
      <div className="aspect-video bg-muted rounded-xl flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No video sources available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="grid grid-cols-3 items-center gap-4">
        <div />
        {/* Server Switcher */}
        <div className="justify-self-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" className="gap-2">
                <Server className="w-4 h-4" />
                {serverNames[activeServer]}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="bg-card border-border">
              {availableServers.map(([key]) => (
                <DropdownMenuItem
                  key={key}
                  onClick={() => {
                    setActiveServer(key)
                    setHasError(false)
                  }}
                  className={cn("cursor-pointer", activeServer === key && "bg-primary/20 text-primary")}
                >
                  {serverNames[key]}
                  {activeServer === key && <span className="ml-auto text-xs text-primary">Active</span>}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Fullscreen */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleFullscreen}
          className="justify-self-end text-muted-foreground hover:text-foreground"
        >
          <Maximize className="w-5 h-5" />
        </Button>
      </div>

      {/* Video Container */}
      <div className="relative aspect-video bg-background rounded-xl overflow-hidden border border-border">
        {hasError ? (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">Failed to load video</p>
              <Button variant="secondary" onClick={() => setHasError(false)}>
                Try Again
              </Button>
            </div>
          </div>
        ) : (
          <iframe
            id="video-iframe"
            src={currentUrl}
            title={title}
            className="absolute inset-0 w-full h-full"
            allowFullScreen
            allow="autoplay; encrypted-media; picture-in-picture"
            onError={() => setHasError(true)}
          />
        )}
      </div>
    </div>
  )
}
