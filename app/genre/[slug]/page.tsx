import { notFound } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ContentCard } from "@/components/content-card"
import { findGenreBySlug, listContent } from "@/lib/pb"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"

interface GenrePageProps {
  params: Promise<{ slug: string }>
}

export default async function GenrePage({ params }: GenrePageProps) {
  const { slug } = await params
  const genre = await findGenreBySlug(slug)

  if (!genre) {
    notFound()
  }

	const { items: genreContent, totalItems } = await listContent({
		page: 1,
		perPage: 120,
		filter: `genre_id ?= "${genre.id}"`,
		sort: "-vote_count",
	})

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
