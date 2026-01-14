import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { HeroSection } from "@/components/hero-section"
import { ContentCarousel } from "@/components/content-carousel"
import { listContent } from "@/lib/pb"

export default async function HomePage() {
	const [{ items: trending }, { items: topRated }, { items: movies }, { items: seriesItems }] = await Promise.all([
		listContent({ page: 1, perPage: 10, sort: "-vote_count" }),
		listContent({ page: 1, perPage: 10, sort: "-imdb_rating" }),
		listContent({ page: 1, perPage: 10, filter: 'type="movie"', sort: "-vote_count" }),
		listContent({ page: 1, perPage: 10, filter: 'type="serie"', sort: "-vote_count" }),
	])

	const featured = topRated[0] || trending[0] || movies[0] || seriesItems[0]
	const featuredItems = topRated.slice(1, 5)

  return (
    <main className="min-h-screen bg-background">
      <Header />

      {featured && <HeroSection content={featured} featuredItems={featuredItems} />}

      <div className="container mx-auto px-4 py-8 space-y-12">
        <ContentCarousel title="Trending Now" items={trending} />
        <ContentCarousel title="Popular Movies" items={movies} />
        <ContentCarousel title="Top Rated TV Series" items={seriesItems} />
        <ContentCarousel title="Top Rated" items={topRated} />
      </div>

      <Footer />
    </main>
  )
}
