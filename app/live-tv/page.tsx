"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ChannelCard } from "@/components/channel-card"
import type { Channel } from "@/lib/types"
import { listCategories, listChannels, listCountries } from "@/lib/pb"
import { useRouter, useSearchParams } from "next/navigation"
import { Search, SlidersHorizontal, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"

export default function LiveTVPage() {
	const router = useRouter()
	const searchParams = useSearchParams()
	const [channels, setChannels] = useState<Channel[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [isLoadingMore, setIsLoadingMore] = useState(false)
	const [page, setPage] = useState(1)
	const [totalPages, setTotalPages] = useState(1)
	const [totalItems, setTotalItems] = useState(0)
	const [activeFilter, setActiveFilter] = useState("")
	const [activeSort, setActiveSort] = useState("title")
	const [categoryOptions, setCategoryOptions] = useState<Array<{ id: string; name: string }>>([])
	const [countryOptions, setCountryOptions] = useState<Array<{ id: string; name: string }>>([])
	const [query, setQuery] = useState("")
	const [selectedCategory, setSelectedCategory] = useState<string>("all")
	const [selectedCountry, setSelectedCountry] = useState<string>("all")
	const [showAll, setShowAll] = useState(true)
	const [sortMode, setSortMode] = useState<"quality" | "name">("quality")
	const [showFilters, setShowFilters] = useState(false)

	const PER_PAGE = 96

	useEffect(() => {
		const raw = (searchParams?.get("showAll") || "").toLowerCase().trim()
		if (raw === "1" || raw === "true" || raw === "yes") setShowAll(true)
	}, [searchParams])

	useEffect(() => {
		if (query.trim() || selectedCategory !== "all" || selectedCountry !== "all") {
			setShowAll(true)
		}
	}, [query, selectedCategory, selectedCountry])

	const esc = (v: string) => v.replaceAll('"', "\\\"")
	const buildFilter = () => {
		const parts: string[] = []
		const q = query.trim()
		if (q) parts.push(`title~"${esc(q)}"`)
		if (selectedCategory !== "all") parts.push(`category ?= "${esc(selectedCategory)}"`)
		if (selectedCountry !== "all") parts.push(`country = "${esc(selectedCountry)}"`)
		return parts.join(" && ")
	}

	const resetFilters = () => {
		setQuery("")
		setSelectedCategory("all")
		setSelectedCountry("all")
		setSortMode("quality")
		setShowAll(true)
		setShowFilters(false)
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
			const pbSort = sortMode === "name" ? "title" : "-quality,title"
			setIsLoading(true)
			setActiveFilter(filter)
			setActiveSort(pbSort)
			listChannels({ page: 1, perPage: PER_PAGE, sort: pbSort, filter })
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
	}, [query, selectedCategory, selectedCountry, sortMode])

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

	const normalized = channels.map((c) => ({ ...c, category: c.category?.trim() || c.categories?.[0] || "Other" }))
	const sorted = [...normalized].sort((a, b) => {
		if (sortMode === "quality") {
			const dq = qualityScore(b.quality) - qualityScore(a.quality)
			if (dq !== 0) return dq
		}
		return a.name.localeCompare(b.name)
	})
	const categories = [...new Set(sorted.map((c) => c.category).filter(Boolean))].sort((a, b) => a.localeCompare(b))

	const canLoadMore = !isLoading && page < totalPages
	const loadMore = async () => {
		if (isLoadingMore || !canLoadMore) return
		setIsLoadingMore(true)
		try {
			const nextPage = page + 1
			const resp = await listChannels({ page: nextPage, perPage: PER_PAGE, sort: activeSort, filter: activeFilter })
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
				{/* Search Header (match Movies Search page) */}
				<div className="mb-8">
					<h1 className="text-3xl font-bold text-foreground mb-4">Live TV</h1>
					<div className="flex flex-col sm:flex-row gap-4">
						<div className="flex-1">
							<div className="relative w-full max-w-3xl mx-auto">
								<Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
								<Input
									type="search"
									placeholder="Search TV channels..."
									value={query}
									onChange={(e) => setQuery(e.target.value)}
									className="pl-12 h-12 bg-secondary border-border focus:ring-primary text-lg w-full"
								/>
								{query && (
									<button
										onClick={() => setQuery("")}
										className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
									>
										<X className="w-5 h-5" />
									</button>
								)}
							</div>
						</div>
						<div className="flex items-center gap-2">
							<Button
								variant="secondary"
								className="lg:hidden"
								onClick={() => setShowFilters((v) => !v)}
							>
								<SlidersHorizontal className="w-5 h-5 mr-2" />
								Filters
							</Button>
						</div>
					</div>
				</div>

				<div className="flex flex-col lg:flex-row gap-8">
					{/* Filters Sidebar */}
					<aside
						className={cn("w-full lg:w-72 flex-shrink-0", showFilters ? "block" : "hidden lg:block")}
					>
						<div className="bg-card border border-border rounded-xl p-6 space-y-6">
							<div className="flex items-center justify-between">
								<h2 className="font-semibold text-foreground">Filters</h2>
								<Button
									variant="ghost"
									size="sm"
									onClick={resetFilters}
									className="text-muted-foreground hover:text-foreground"
								>
									<X className="w-4 h-4 mr-1" />
									Reset
								</Button>
							</div>

							<div className="space-y-2">
								<p className="text-xs uppercase tracking-wide text-muted-foreground">Category</p>
								<Select value={selectedCategory} onValueChange={setSelectedCategory}>
									<SelectTrigger className="bg-secondary border-border">
										<SelectValue placeholder="All categories" />
									</SelectTrigger>
									<SelectContent className="bg-card border-border">
										<SelectItem value="all">All categories</SelectItem>
										{categoryOptions.map((c) => (
											<SelectItem key={c.id} value={c.id}>
												{c.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<p className="text-xs uppercase tracking-wide text-muted-foreground">Country</p>
								<Select value={selectedCountry} onValueChange={setSelectedCountry}>
									<SelectTrigger className="bg-secondary border-border">
										<SelectValue placeholder="All countries" />
									</SelectTrigger>
									<SelectContent className="bg-card border-border">
										<SelectItem value="all">All countries</SelectItem>
										{countryOptions.map((c) => (
											<SelectItem key={c.id} value={c.id}>
												{c.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<p className="text-xs uppercase tracking-wide text-muted-foreground">Sort</p>
								<Select
									value={sortMode}
									onValueChange={(v) => setSortMode(v === "name" ? "name" : "quality")}
								>
									<SelectTrigger className="bg-secondary border-border">
										<SelectValue />
									</SelectTrigger>
									<SelectContent className="bg-card border-border">
										<SelectItem value="quality">Highest quality</SelectItem>
										<SelectItem value="name">Name (A-Z)</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div className="pt-2">
								<Button variant="secondary" className="w-full" onClick={() => setShowAll((v) => !v)}>
									{showAll ? "Group by category" : "Show all channels"}
								</Button>
							</div>
						</div>
					</aside>

					{/* Results */}
					<div className="flex-1">
						<div className="flex items-center justify-between mb-4">
							<p className="text-muted-foreground">
								{isLoading ? "Loading..." : `${totalItems} channel${totalItems !== 1 ? "s" : ""} streaming live`}
								{query && (
									<>
										{" "}
										for <span className="text-foreground font-medium">&quot;{query}&quot;</span>
									</>
								)}
							</p>
						</div>

						{isLoading ? (
							<div className="text-center py-16">
								<p className="text-muted-foreground">Loading...</p>
							</div>
						) : normalized.length === 0 ? (
							<div className="text-center py-16">
								<h2 className="text-xl font-semibold text-foreground mb-2">No channels found</h2>
								<p className="text-muted-foreground mb-4">Try adjusting your search or filters</p>
								<Button variant="secondary" onClick={resetFilters}>
									Reset Filters
								</Button>
							</div>
						) : showAll ? (
							<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 lg:gap-6">
								{sorted.map((channel) => (
									<ChannelCard
										key={channel.id}
										channel={channel}
										onWatch={(ch) => router.push(`/live-tv/${ch.id}`)}
									/>
								))}
							</div>
						) : (
							categories.map((category) => (
								<section key={category} className="mb-12">
									<h2 className="text-xl font-bold text-foreground mb-4">{category}</h2>
									<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 lg:gap-6">
										{sorted
											.filter((c) => c.category === category)
											.map((channel) => (
												<ChannelCard
													key={channel.id}
													channel={channel}
													onWatch={(ch) => router.push(`/live-tv/${ch.id}`)}
												/>
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
				</div>
      </div>

      <Footer />
    </main>
  )
}
