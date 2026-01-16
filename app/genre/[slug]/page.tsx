import { notFound } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ContentCard } from "@/components/content-card"
import { getGenreCountsCached } from "@/lib/genre-counts"
import { listContent } from "@/lib/pb"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"

interface GenrePageProps {
  params: Promise<{ slug: string }>
}

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "http://localhost:3000"
}

async function findBestGenreBySlug(slug: string): Promise<{ id: string; name: string } | null> {
  const s = slug.trim().toLowerCase()
  if (!s) return null

  const escaped = s.replaceAll('"', "\\\"")
  const u = new URL("/api/pb/genres", siteUrl())
  u.searchParams.set("page", "1")
  u.searchParams.set("perPage", "200")
  u.searchParams.set("filter", `name~"${escaped}"`)
  u.searchParams.set("fields", "id,name")
  u.searchParams.set("skipTotal", "1")

  const res = await fetch(u.toString(), { cache: "no-store" }).catch(() => null)
  if (!res || !res.ok) return null
  const json = (await res.json().catch(() => null)) as { items?: Array<{ id?: unknown; name?: unknown }> } | null
  const items = Array.isArray(json?.items) ? json!.items : []

  const candidates = items
    .map((it) => {
      const id = typeof it?.id === "string" ? it.id.trim() : ""
      const raw = typeof it?.name === "string" ? it.name.trim() : ""
      return { id, raw }
    })
    .filter((g) => g.id && g.raw && g.raw.toLowerCase() === s)

  if (candidates.length === 0) return null
  if (candidates.length === 1) return { id: candidates[0]!.id, name: candidates[0]!.raw }

  const countsById = await getGenreCountsCached().catch(() => ({} as Record<string, { name: string; count: number }>))
  let best = candidates[0]!
  let bestCount = countsById[best.id]?.count || 0
  for (const c of candidates.slice(1)) {
    const cnt = countsById[c.id]?.count || 0
    if (cnt > bestCount) {
      best = c
      bestCount = cnt
    }
  }

  return { id: best.id, name: best.raw }
}

export default async function GenrePage({ params }: GenrePageProps) {
  const { slug } = await params
  const genre = await findBestGenreBySlug(slug)

  if (!genre) {
    notFound()
  }

  const primaryFilter = `genre_id ?= "${genre.id.replaceAll('"', "\\\"")}"`
  const altFilter = `genre_id.id ?= "${genre.id.replaceAll('"', "\\\"")}"`

  let { items: genreContent, totalItems } = await listContent({
    page: 1,
    perPage: 120,
    filter: primaryFilter,
    sort: "-imdb_rating",
  })

  if (totalItems === 0) {
    const alt = await listContent({
      page: 1,
      perPage: 120,
      filter: altFilter,
      sort: "-imdb_rating",
    })
    genreContent = alt.items
    totalItems = alt.totalItems
  }

  return (
    <main className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 pt-24 lg:pt-32 pb-8">
        {/* Breadcrumb */}
        <Link
          href="/genres"
          className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          All Genres
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-2">{genre.name}</h1>
          <p className="text-muted-foreground">
            {totalItems} title{totalItems !== 1 ? "s" : ""} in this genre
          </p>
        </div>

        {/* Content Grid */}
        {genreContent.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 lg:gap-6">
            {genreContent.map((content) => (
              <ContentCard key={content.imdb_id} content={content} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-muted-foreground">No content found in this genre</p>
          </div>
        )}
      </div>

      <Footer />
    </main>
  )
}
