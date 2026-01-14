"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ChannelCard } from "@/components/channel-card"
import type { Channel } from "@/lib/types"
import { listChannels } from "@/lib/pb"
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
	const [query, setQuery] = useState("")
	const [selectedCategory, setSelectedCategory] = useState<string>("all")
	const [selectedCountry, setSelectedCountry] = useState<string>("all")

	useEffect(() => {
		let cancelled = false
		setIsLoading(true)

		const loadAll = async () => {
			const out: Channel[] = []
			let page = 1
			let totalPages = 1
			while (page <= totalPages) {
				const resp = await listChannels({ page, perPage: 200, sort: "title" })
				out.push(...resp.items)
				totalPages = resp.totalPages
				page += 1
			}
			return out
		}

		loadAll()
			.then((items) => {
				if (cancelled) return
				setChannels(items)
			})
			.catch(() => {
				if (cancelled) return
				setChannels([])
			})
			.finally(() => {
				if (cancelled) return
				setIsLoading(false)
			})
		return () => {
			cancelled = true
		}
	}, [])

	const allCategories = [
		...new Set(channels.flatMap((c) => c.categories || (c.category ? [c.category] : [])).filter((v): v is string => Boolean(v))),
	].sort((a, b) => a.localeCompare(b))
	const allCountries = [...new Set(channels.map((c) => c.country).filter((v): v is string => Boolean(v)))].sort((a, b) =>
		a.localeCompare(b),
	)

	const q = query.trim().toLowerCase()
	const filtered = channels.filter((c) => {
		if (q) {
			const hay = `${c.name} ${(c.categories || []).join(" ")} ${c.category || ""} ${c.country || ""}`.toLowerCase()
			if (!hay.includes(q)) return false
		}

		if (selectedCategory !== "all") {
			const cats = c.categories || (c.category ? [c.category] : [])
			if (!cats.includes(selectedCategory)) return false
		}

		if (selectedCountry !== "all") {
			if ((c.country || "") !== selectedCountry) return false
		}

		return true
	})

	const normalized = filtered.map((c) => ({ ...c, category: c.category?.trim() || c.categories?.[0] || "Other" }))
	const categories = [...new Set(normalized.map((c) => c.category).filter(Boolean))]

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
					{isLoading ? "Loading channels..." : `${filtered.length} channels streaming live`}
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
						{allCategories.map((c) => (
							<SelectItem key={c} value={c}>
								{c}
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
						{allCountries.map((c) => (
							<SelectItem key={c} value={c}>
								{c}
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
      </div>

      <Footer />
    </main>
  )
}
