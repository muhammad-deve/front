"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ChannelCard } from "@/components/channel-card"
import type { Channel } from "@/lib/types"
import { listCategories, listChannels, listCountries } from "@/lib/pb"
import { Radio, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"

export default function LiveTVPage() {
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null)
	const [channels, setChannels] = useState<Channel[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [isLoadingMore, setIsLoadingMore] = useState(false)
	const [page, setPage] = useState(1)
	const [totalPages, setTotalPages] = useState(1)
	const [totalItems, setTotalItems] = useState(0)
	const [activeFilter, setActiveFilter] = useState("")
	const [categoryOptions, setCategoryOptions] = useState<Array<{ id: string; name: string }>>([])
	const [countryOptions, setCountryOptions] = useState<Array<{ id: string; name: string }>>([])
	const [relatedChannels, setRelatedChannels] = useState<Channel[]>([])
	const [isLoadingRelated, setIsLoadingRelated] = useState(false)
	const [query, setQuery] = useState("")
	const [selectedCategory, setSelectedCategory] = useState<string>("all")
	const [selectedCountry, setSelectedCountry] = useState<string>("all")

	const PER_PAGE = 96

	const esc = (v: string) => v.replaceAll('"', "\\\"")
	const buildFilter = () => {
		const parts: string[] = []
		const q = query.trim()
		if (q) parts.push(`title~"${esc(q)}"`)
		if (selectedCategory !== "all") parts.push(`category ?= "${esc(selectedCategory)}"`)
		if (selectedCountry !== "all") parts.push(`country = "${esc(selectedCountry)}"`)
		return parts.join(" && ")
	}

	useEffect(() => {
		let cancelled = false
		Promise.all([listCategories(), listCountries()])
			.then(([cats, countries]) => {
				if (cancelled) return
				setCategoryOptions(cats)
				setCountryOptions(countries)
			})
			.catch(() => {
				if (cancelled) return
				setCategoryOptions([])
				setCountryOptions([])
			})
		return () => {
			cancelled = true
		}
	}, [])

	useEffect(() => {
		let cancelled = false
		const timer = setTimeout(() => {
			const filter = buildFilter()
			setIsLoading(true)
			setActiveFilter(filter)
			listChannels({ page: 1, perPage: PER_PAGE, sort: "title", filter })
				.then((resp) => {
					if (cancelled) return
					setChannels(resp.items)
					setPage(resp.page)
					setTotalPages(resp.totalPages)
					setTotalItems(resp.totalItems)
				})
				.catch(() => {
					if (cancelled) return
					setChannels([])
					setPage(1)
					setTotalPages(1)
					setTotalItems(0)
				})
				.finally(() => {
					if (cancelled) return
					setIsLoading(false)
				})
		}, 250)

		return () => {
			cancelled = true
			clearTimeout(timer)
		}
	}, [query, selectedCategory, selectedCountry])

	useEffect(() => {
		let cancelled = false
		if (!activeChannel) {
			setRelatedChannels([])
			setIsLoadingRelated(false)
			return
		}

		const loadRelated = async () => {
			const parts: string[] = []
			if (activeChannel.categoryIds?.[0]) {
				parts.push(`category ?= "${activeChannel.categoryIds[0].replaceAll('"', "\\\"")}"`)
			}
			if (activeChannel.countryId) {
				parts.push(`country = "${activeChannel.countryId.replaceAll('"', "\\\"")}"`)
			}
			parts.push(`id != "${activeChannel.id.replaceAll('"', "\\\"")}"`)
			const filter = parts.join(" && ")

			const resp = await listChannels({ page: 1, perPage: 12, sort: "title", filter })
			return resp.items
		}

		setIsLoadingRelated(true)
		loadRelated()
			.then((items) => {
				if (cancelled) return
				setRelatedChannels(items)
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
	}, [activeChannel])

	const normalized = channels.map((c) => ({ ...c, category: c.category?.trim() || c.categories?.[0] || "Other" }))
	const categories = [...new Set(normalized.map((c) => c.category).filter(Boolean))]

	const canLoadMore = !isLoading && page < totalPages
	const loadMore = async () => {
		if (isLoadingMore || !canLoadMore) return
		setIsLoadingMore(true)
		try {
			const nextPage = page + 1
			const resp = await listChannels({ page: nextPage, perPage: PER_PAGE, sort: "title", filter: activeFilter })
			setChannels((prev) => [...prev, ...resp.items])
			setPage(resp.page)
			setTotalPages(resp.totalPages)
			setTotalItems(resp.totalItems)
		} finally {
			setIsLoadingMore(false)
		}
	}

  return (
    <main className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 pt-24 lg:pt-32 pb-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
            <Radio className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Live TV</h1>
            <p className="text-muted-foreground">
					{isLoading ? "Loading channels..." : `${totalItems} channels streaming live`}
			</p>
          </div>
        </div>

			<div className="mb-8 grid grid-cols-1 lg:grid-cols-3 gap-4">
				<Input
					placeholder="Search channels..."
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					className="h-11 bg-secondary border-border"
				/>

				<Select value={selectedCategory} onValueChange={setSelectedCategory}>
					<SelectTrigger className="w-full h-11 bg-secondary border-border">
						<SelectValue placeholder="Category" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All categories</SelectItem>
						{categoryOptions.map((c) => (
							<SelectItem key={c.id} value={c.id}>
								{c.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				<Select value={selectedCountry} onValueChange={setSelectedCountry}>
					<SelectTrigger className="w-full h-11 bg-secondary border-border">
						<SelectValue placeholder="Country" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All countries</SelectItem>
						{countryOptions.map((c) => (
							<SelectItem key={c.id} value={c.id}>
								{c.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

        {/* Active Player Modal */}
        {activeChannel && (
          <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-5xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-destructive text-destructive-foreground text-xs font-bold rounded">
                    <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                    LIVE
                  </div>
                  <h2 className="text-xl font-bold text-foreground">{activeChannel.name}</h2>
                  {activeChannel.quality && (
                    <span className="px-2 py-1 bg-secondary text-foreground text-xs font-bold rounded">
                      {activeChannel.quality}
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setActiveChannel(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-6 h-6" />
                </Button>
              </div>

              {/* Video Player */}
              <div className="aspect-video bg-black rounded-xl overflow-hidden border border-border">
                <iframe
                  src={activeChannel.url}
                  title={activeChannel.name}
                  className="w-full h-full"
                  allowFullScreen
                  allow="autoplay; encrypted-media"
                />
              </div>

              {(activeChannel.category || activeChannel.country) && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-foreground">More like this</h3>
                  </div>
                  {isLoadingRelated ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Loading...</p>
                    </div>
                  ) : relatedChannels.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {relatedChannels.map((ch) => (
                        <ChannelCard key={ch.id} channel={ch} onWatch={setActiveChannel} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No similar channels found.</p>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-4 flex items-center justify-between">
                <p className="text-muted-foreground">
                  Category: <span className="text-foreground">{activeChannel.category}</span>
                </p>
                <Button variant="secondary" onClick={() => setActiveChannel(null)}>
                  Close Player
                </Button>
              </div>
            </div>
          </div>
        )}

			{/* Channels by Category */}
			{isLoading ? (
				<div className="text-center py-16">
					<p className="text-muted-foreground">Loading...</p>
				</div>
			) : normalized.length === 0 ? (
				<div className="text-center py-16">
					<p className="text-muted-foreground">No channels match your filters.</p>
				</div>
			) : (
				categories.map((category) => (
					<section key={category} className="mb-12">
						<h2 className="text-xl font-bold text-foreground mb-4">{category}</h2>
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
							{normalized
								.filter((c) => c.category === category)
								.map((channel) => (
									<ChannelCard key={channel.id} channel={channel} onWatch={setActiveChannel} />
								))}
						</div>
					</section>
				))
			)}

			{!isLoading && normalized.length > 0 && (
				<div className="flex justify-center mt-8">
					<Button
						variant="secondary"
						onClick={loadMore}
						disabled={!canLoadMore || isLoadingMore}
						className="min-w-40"
					>
						{isLoadingMore ? "Loading..." : canLoadMore ? "Load more" : "No more channels"}
					</Button>
				</div>
			)}
      </div>

      <Footer />
    </main>
  )
}
