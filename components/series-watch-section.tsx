"use client"

import Image from "next/image"
import { useEffect, useMemo, useRef, useState } from "react"
import type { VideoSources } from "@/lib/types"
import { VideoPlayer } from "@/components/video-player"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

type SeasonInfo = { season: string; episodeCount: number }

type ApiSeasonsResp = { seasons?: Array<{ season?: string; episodeCount?: number }> }

type ApiEpisodesResp = {
  episodes?: Array<{
    id?: string
    title?: string
    primaryImage?: { url?: string; width?: number; height?: number }
    season?: string
    episodeNumber?: number
    runtimeSeconds?: number
    plot?: string
    rating?: { aggregateRating?: number; voteCount?: number }
  }>
  totalCount?: number
}

type EpisodeUI = {
  id: string
  season: number
  episodeNumber: number
  title: string
  img?: string
  runtimeSeconds?: number
  rating?: number
  plot?: string
}

function clampInt(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}

function toSeasonNumber(s: string | undefined): number {
  const n = Number.parseInt((s || "").trim(), 10)
  return Number.isFinite(n) && n > 0 ? n : 1
}

function buildTvEpisodeUrl(opts: {
  key: keyof VideoSources
  url: string
  season: number
  episode: number
}): string {
  const { key, url, season, episode } = opts
  const s = String(season)
  const e = String(episode)

  const replaceOnce = (re: RegExp, next: string) => {
    const out = url.replace(re, next)
    return out === url ? null : out
  }

  if (key === "vidsrc_url") {
    return (
      replaceOnce(/\/(\d+)-(\d+)(?=$|[?#])/, `/${s}-${e}`) ||
      (url.endsWith("/") ? `${url}${s}-${e}` : `${url}/${s}-${e}`)
    )
  }

  if (key === "vidlink_pro_url" || key === "autoembed_url") {
    return (
      replaceOnce(/\/(\d+)\/(\d+)(?=$|[?#])/, `/${s}/${e}`) ||
      (url.endsWith("/") ? `${url}${s}/${e}` : `${url}/${s}/${e}`)
    )
  }

  if (key === "moviesapi_url") {
    return (
      replaceOnce(/-(\d+)-(\d+)(?=$|[?#])/, `-${s}-${e}`) ||
      (url.endsWith("/") ? `${url}${s}-${e}` : `${url}-${s}-${e}`)
    )
  }

  return url
}

export function SeriesWatchSection(props: {
  imdbId: string
  tmdbId?: string
  title: string
  sources: VideoSources
}) {
  const imdbId = props.imdbId.trim()
  const [seasons, setSeasons] = useState<SeasonInfo[]>([])
  const [loadingSeasons, setLoadingSeasons] = useState(false)
  const [loadingEpisodes, setLoadingEpisodes] = useState(false)
  const [season, setSeason] = useState<number>(1)
  const [episode, setEpisode] = useState<number>(1)
  const [episodes, setEpisodes] = useState<EpisodeUI[]>([])
  const episodesCache = useRef(new Map<number, EpisodeUI[]>())

  const seasonEpisodeCounts = useMemo(() => {
    const map = new Map<number, number>()
    for (const s of seasons) {
      const sn = toSeasonNumber(s.season)
      const cnt = typeof s.episodeCount === "number" ? s.episodeCount : 0
      if (sn > 0 && cnt > 0) map.set(sn, cnt)
    }
    return map
  }, [seasons])

  const currentEpisodeCount = seasonEpisodeCounts.get(season) || 0

  useEffect(() => {
    if (!imdbId) return

    let cancelled = false
    setLoadingSeasons(true)

    fetch(`/api/imdb/titles/${encodeURIComponent(imdbId)}/seasons`, { cache: "no-store" })
      .then(async (r) => {
        const json = (await r.json().catch(() => null)) as ApiSeasonsResp | null
        if (!r.ok) throw new Error((json as any)?.error || "Failed to load seasons")
        return json
      })
      .then((json) => {
        if (cancelled) return
        const s = (json?.seasons || [])
          .map((x) => ({
            season: (x.season || "").trim(),
            episodeCount: typeof x.episodeCount === "number" ? x.episodeCount : 0,
          }))
          .filter((x) => x.season && x.episodeCount > 0)

        setSeasons(s)
        const firstSeason = s.length > 0 ? toSeasonNumber(s[0]!.season) : 1
        setSeason(firstSeason)
        setEpisode(1)
      })
      .catch(() => {
        if (!cancelled) {
          setSeasons([])
          setSeason(1)
          setEpisode(1)
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingSeasons(false)
      })

    return () => {
      cancelled = true
    }
  }, [imdbId])

  useEffect(() => {
    if (!imdbId) return

    const cached = episodesCache.current.get(season)
    if (cached) {
      setEpisodes(cached)
      const maxEp = cached.length > 0 ? cached.length : currentEpisodeCount
      setEpisode((prev) => clampInt(prev, 1, Math.max(1, maxEp)))
      return
    }

    let cancelled = false
    setLoadingEpisodes(true)

    fetch(`/api/imdb/titles/${encodeURIComponent(imdbId)}/episodes?season=${encodeURIComponent(String(season))}`, {
      cache: "no-store",
    })
      .then(async (r) => {
        const json = (await r.json().catch(() => null)) as ApiEpisodesResp | null
        if (!r.ok) throw new Error((json as any)?.error || "Failed to load episodes")
        return json
      })
      .then((json) => {
        if (cancelled) return
        const eps: EpisodeUI[] = []
        for (const x of json?.episodes || []) {
          const sn = Number.parseInt(String(x.season || season), 10)
          const en = typeof x.episodeNumber === "number" ? x.episodeNumber : 0
          if (!Number.isFinite(sn) || sn <= 0) continue
          if (!Number.isFinite(en) || en <= 0) continue

          const img = (x.primaryImage?.url || "").trim()
          const title = (x.title || "").trim()
          const plot = (x.plot || "").trim()

          eps.push({
            id: (x.id || "").trim() || `${imdbId}-s${sn}e${en}`,
            season: sn,
            episodeNumber: en,
            title: title || `Episode ${en}`,
            img: img || undefined,
            runtimeSeconds: typeof x.runtimeSeconds === "number" ? x.runtimeSeconds : undefined,
            rating: typeof x.rating?.aggregateRating === "number" ? x.rating.aggregateRating : undefined,
            plot: plot || undefined,
          })
        }
        eps.sort((a, b) => a.episodeNumber - b.episodeNumber)

        episodesCache.current.set(season, eps)
        setEpisodes(eps)
        const maxEp = eps.length > 0 ? eps.length : currentEpisodeCount
        setEpisode((prev) => clampInt(prev, 1, Math.max(1, maxEp)))
      })
      .catch(() => {
        if (!cancelled) setEpisodes([])
      })
      .finally(() => {
        if (!cancelled) setLoadingEpisodes(false)
      })

    return () => {
      cancelled = true
    }
  }, [currentEpisodeCount, imdbId, season])

  const effectiveSources: VideoSources = useMemo(() => {
    const out: VideoSources = {}
    for (const [k, v] of Object.entries(props.sources) as Array<[keyof VideoSources, string | undefined]>) {
      const url = (v || "").trim()
      if (!url) continue
      out[k] = buildTvEpisodeUrl({ key: k, url, season, episode })
    }
    return out
  }, [episode, props.sources, season])

  const seasonOptions = useMemo(() => {
    const s = seasons.map((x) => toSeasonNumber(x.season)).filter((n) => n > 0)
    if (s.length === 0) return [1]
    return Array.from(new Set(s)).sort((a, b) => a - b)
  }, [seasons])

  const episodeOptions = useMemo(() => {
    if (episodes.length > 0) return episodes.map((e) => e.episodeNumber)
    const cnt = currentEpisodeCount || 1
    const safe = clampInt(cnt, 1, 200)
    return Array.from({ length: safe }, (_, i) => i + 1)
  }, [currentEpisodeCount, episodes])

  const activeEpisode = episodes.find((x) => x.episodeNumber === episode)

  return (
    <div className="space-y-4">
      <Card className="border-border bg-card/50 backdrop-blur-sm p-4 lg:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-4">
          <div className="flex-1 min-w-0">
            <div className="text-sm text-muted-foreground">Now Watching</div>
            <div className="text-base lg:text-lg font-semibold text-foreground truncate">
              Season {season}, Episode {episode}
              {activeEpisode?.title ? ` • ${activeEpisode.title}` : ""}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={String(season)}
              onValueChange={(v) => {
                const next = Number.parseInt(v, 10)
                setSeason(Number.isFinite(next) && next > 0 ? next : 1)
                setEpisode(1)
              }}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Season" />
              </SelectTrigger>
              <SelectContent>
                {seasonOptions.map((s) => (
                  <SelectItem key={`s-${s}`} value={String(s)}>
                    Season {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={String(episode)}
              onValueChange={(v) => {
                const next = Number.parseInt(v, 10)
                setEpisode(Number.isFinite(next) && next > 0 ? next : 1)
              }}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Episode" />
              </SelectTrigger>
              <SelectContent>
                {episodeOptions.map((e) => (
                  <SelectItem key={`e-${e}`} value={String(e)}>
                    Episode {e}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(loadingSeasons || loadingEpisodes) && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground pl-1">
                <Spinner className="size-4" />
                Loading
              </div>
            )}
          </div>
        </div>

        {episodes.length > 0 && (
          <div className="mt-4">
            <div className="flex gap-3 pb-3 overflow-x-auto scrollbar-hide">
              {episodes.map((ep) => {
                const selected = ep.episodeNumber === episode
                return (
                  <button
                    key={ep.id}
                    type="button"
                    onClick={() => setEpisode(ep.episodeNumber)}
                    className={cn(
                      "group relative flex-shrink-0 w-[220px] rounded-xl overflow-hidden border bg-background/40 hover:bg-background/60 transition-colors",
                      selected ? "border-primary ring-2 ring-primary/30" : "border-border",
                    )}
                  >
                    <div className="relative h-[124px] bg-muted">
                      {ep.img ? (
                        <Image
                          src={ep.img}
                          alt={ep.title}
                          fill
                          className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted/30" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
                      <div className="absolute bottom-2 left-2 right-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-xs font-semibold text-foreground">E{ep.episodeNumber}</div>
                          {typeof ep.rating === "number" && (
                            <div className="text-xs text-primary font-semibold">{ep.rating.toFixed(1)}</div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="p-3 text-left">
                      <div className="text-sm font-semibold text-foreground line-clamp-1">{ep.title}</div>
                      {ep.plot && <div className="mt-1 text-xs text-muted-foreground line-clamp-2">{ep.plot}</div>}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {episodes.length === 0 && !loadingEpisodes && currentEpisodeCount > 0 && (
          <div className="mt-4 flex items-center justify-between gap-3 text-sm text-muted-foreground">
            <div>
              Episode list isn’t available right now, but you can still switch episodes.
            </div>
            <Button
              variant="secondary"
              onClick={() => {
                episodesCache.current.delete(season)
                setEpisodes([])
              }}
            >
              Refresh
            </Button>
          </div>
        )}
      </Card>

      <VideoPlayer sources={effectiveSources} title={props.title} excludeServers={["gomo_url"]} />
    </div>
  )
}
