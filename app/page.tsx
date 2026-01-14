import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { HeroSection } from "@/components/hero-section"
import { ContentCarousel } from "@/components/content-carousel"
import { mockMovies, mockTVSeries, allContent } from "@/lib/mock-data"

export default function HomePage() {
  // Featured content for hero
  const featured = allContent[0]
  const featuredItems = allContent.slice(1, 5)

  // Content sections
  const trending = [...allContent].sort((a, b) => (b.rating?.voteCount || 0) - (a.rating?.voteCount || 0)).slice(0, 10)

  const topRated = [...allContent]
    .sort((a, b) => (b.rating?.aggregateRating || 0) - (a.rating?.aggregateRating || 0))
    .slice(0, 10)

  const actionContent = allContent.filter((c) => c.genres.some((g) => ["Action", "Adventure"].includes(g)))

  const dramaContent = allContent.filter((c) => c.genres.some((g) => ["Drama", "Romance"].includes(g)))

  const sciFiContent = allContent.filter((c) => c.genres.some((g) => ["Sci-Fi", "Fantasy"].includes(g)))

  return (
    <main className="min-h-screen bg-background">
      <Header />

      <HeroSection content={featured} featuredItems={featuredItems} />

      <div className="container mx-auto px-4 py-8 space-y-12">
        <ContentCarousel title="Trending Now" items={trending} />
        <ContentCarousel title="Popular Movies" items={mockMovies} />
        <ContentCarousel title="Top Rated TV Series" items={mockTVSeries} />
        <ContentCarousel title="Top Rated" items={topRated} />
        <ContentCarousel title="Action & Adventure" items={actionContent} />
        <ContentCarousel title="Drama & Romance" items={dramaContent} />
        <ContentCarousel title="Sci-Fi & Fantasy" items={sciFiContent} />
      </div>

      <Footer />
    </main>
  )
}
