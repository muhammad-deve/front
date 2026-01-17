"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ChannelCard } from "@/components/channel-card"
import { Button } from "@/components/ui/button"
import type { Channel } from "@/lib/types"
import { getChannelById, listChannels } from "@/lib/pb"
import { ArrowLeft, Loader2, Radio } from "lucide-react"

export default function LiveTVChannelPage() {
  const router = useRouter()
  const params = useParams()
  const id = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : ""

  const [channel, setChannel] = useState<Channel | null>(null)
  const [isLoadingChannel, setIsLoadingChannel] = useState(true)

  const [playerLoaded, setPlayerLoaded] = useState(false)

  const [relatedChannels, setRelatedChannels] = useState<Channel[]>([])
  const [isLoadingRelated, setIsLoadingRelated] = useState(false)

  const esc = (v: string) => v.replaceAll('"', "\\\"")

  useEffect(() => {
    let cancelled = false
    setIsLoadingChannel(true)
    setChannel(null)

    getChannelById(id)
      .then((ch) => {
        if (cancelled) return
        setChannel(ch)
      })
      .catch(() => {
        if (cancelled) return
        setChannel(null)
      })
      .finally(() => {
        if (cancelled) return
        setIsLoadingChannel(false)
      })

    return () => {
      cancelled = true
    }
  }, [id])

  useEffect(() => {
    setPlayerLoaded(false)
  }, [channel?.id])

  useEffect(() => {
    let cancelled = false

    if (!channel) {
      setRelatedChannels([])
      setIsLoadingRelated(false)
      return
    }

    const parts: string[] = []
    if (channel.categoryIds?.[0]) {
      parts.push(`category ?= "${esc(channel.categoryIds[0])}"`)
    }
    if (channel.countryId) {
      parts.push(`country = "${esc(channel.countryId)}"`)
    }

    if (parts.length === 0) {
      setRelatedChannels([])
      setIsLoadingRelated(false)
      return
    }

    const relatedFilter =
      parts.length === 1
        ? `${parts[0]} && id != "${esc(channel.id)}"`
        : `(${parts.join(" || ")}) && id != "${esc(channel.id)}"`

    setIsLoadingRelated(true)
    listChannels({ page: 1, perPage: 12, sort: "title", filter: relatedFilter })
      .then((resp) => {
        if (cancelled) return
        setRelatedChannels(resp.items)
      })
      .catch(() => {
        if (cancelled) return
        setRelatedChannels([])
      })
      .finally(() => {
        if (cancelled) return
        setIsLoadingRelated(false)
      })

    return () => {
      cancelled = true
    }
  }, [channel])

  const qualityScore = (q?: string): number => {
    const s = (q || "").toLowerCase().trim()
    const m = s.match(/(\d{3,4})\s*p/)
    if (m) return Number(m[1])
    if (s.includes("4k") || s.includes("2160")) return 2160
    if (s.includes("fhd") || s.includes("full hd")) return 1080
    if (s.includes("hd")) return 720
    if (s.includes("sd")) return 480
    return 0
  }

  return (
    <main className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 pt-24 lg:pt-32 pb-8">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => router.push("/live-tv")} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>

          <div className="flex items-center gap-2 text-muted-foreground">
            <Radio className="w-4 h-4" />
            <span className="text-sm">Live TV</span>
          </div>
        </div>

        {isLoadingChannel ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">Loading channel...</p>
          </div>
        ) : !channel ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">Channel not found.</p>
            <div className="mt-4 flex justify-center">
              <Button variant="secondary" onClick={() => router.push("/live-tv")}>Back to Live TV</Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-1.5 px-2 py-1 bg-destructive text-destructive-foreground text-xs font-bold rounded">
                <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                LIVE
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground">{channel.name}</h1>
              {channel.quality && (
                <span className="px-2 py-1 bg-secondary text-foreground text-xs font-bold rounded">{channel.quality}</span>
              )}
            </div>

            <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-border">
              {!playerLoaded && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70">
                  <Loader2 className="w-7 h-7 text-white animate-spin" />
                  <p className="text-sm text-white/80">Loading stream...</p>
                </div>
              )}
              <iframe
                src={channel.url}
                title={channel.name}
                className="w-full h-full"
                allowFullScreen
                allow="autoplay; encrypted-media"
                onLoad={() => setPlayerLoaded(true)}
              />
            </div>

            <div className="mt-5 rounded-xl border border-border bg-secondary/40 p-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Category</p>
                  <p className="text-base font-semibold text-foreground">{channel.category || "-"}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Country</p>
                  <p className="text-base font-semibold text-foreground">{channel.country || "-"}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Language</p>
                  <p className="text-base font-semibold text-foreground">{channel.language || "-"}</p>
                </div>
              </div>
            </div>

            <div className="mt-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-foreground">More like this</h2>
                <Button variant="secondary" onClick={() => router.push("/live-tv?showAll=1")}>Show all TV channels</Button>
              </div>

              {isLoadingRelated ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Loading...</p>
                </div>
              ) : relatedChannels.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {[...relatedChannels]
                    .sort((a, b) => {
                      const dq = qualityScore(b.quality) - qualityScore(a.quality)
                      if (dq !== 0) return dq
                      return a.name.localeCompare(b.name)
                    })
                    .map((ch) => (
                      <ChannelCard
                        key={ch.id}
                        channel={ch}
                        onWatch={(next) => router.push(`/live-tv/${next.id}`)}
                      />
                    ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No similar channels found.</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <Footer />
    </main>
  )
}
