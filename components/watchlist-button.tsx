"use client"

import { useAuth } from "./auth-provider"
import { Button } from "@/components/ui/button"
import { Plus, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface WatchlistButtonProps {
  contentId: string
  className?: string
}

export function WatchlistButton({ contentId, className }: WatchlistButtonProps) {
  const { isAuthenticated, isInWatchlist, addToWatchlist, removeFromWatchlist } = useAuth()

  const inWatchlist = isInWatchlist(contentId)

  const handleClick = async () => {
    if (!isAuthenticated) {
      window.location.href = "/sign-in"
      return
    }
    if (inWatchlist) {
      await removeFromWatchlist(contentId)
    } else {
      await addToWatchlist(contentId)
    }
  }

  return (
    <Button
      onClick={handleClick}
      variant={inWatchlist ? "default" : "secondary"}
      className={cn(
        "gap-2",
        inWatchlist
          ? "bg-primary text-primary-foreground hover:bg-primary/90"
          : "bg-secondary text-foreground hover:bg-muted",
        className,
      )}
    >
      {inWatchlist ? (
        <>
          <Check className="w-5 h-5" />
          In My List
        </>
      ) : (
        <>
          <Plus className="w-5 h-5" />
          Add to My List
        </>
      )}
    </Button>
  )
}
