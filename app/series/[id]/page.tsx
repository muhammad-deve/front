import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { SeriesWatchSection } from "@/components/series-watch-section"
import { CastSection } from "@/components/cast-section"
import { ContentCarousel } from "@/components/content-carousel"
import { RelatedContentSection } from "@/components/related-content-section"
import { PosterLightbox } from "@/components/poster-lightbox"
import { getContentByImdb } from "@/lib/pb"
import { formatRuntime, formatRating, formatVoteCount } from "@/lib/utils"
import { Star, Calendar, Clock, Tv } from "lucide-react"
import { WatchlistButton } from "@/components/watchlist-button"

interface SeriesPageProps {
  params: Promise<{ id: string }>
}

export default async function SeriesPage({ params }: SeriesPageProps) {
  const { id } = await params
  const series = await getContentByImdb(id)

  if (!series || series.type !== "tv") {
    notFound()
  }

  return (
    <main className="min-h-screen bg-background">
      <Header />

      {/* Hero Background */}
      <div className="relative">
        <div className="absolute inset-0 h-[60vh]">
          <Image
            src={
              series.backdropImage?.url ||
              series.primaryImage?.url ||
              "/placeholder.svg?height=1080&width=1920&query=tv series scene" ||
              "/placeholder.svg"
            }
            alt={series.title}
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/50 to-transparent" />
        </div>

        {/* Content */}
        <div className="relative mx-auto w-full max-w-7xl 2xl:max-w-[1600px] px-4 pt-24 lg:pt-32">
          <div className="grid lg:grid-cols-[300px_1fr] gap-8">
            {/* Poster */}
            <div className="hidden lg:block">
              <div className="sticky top-24">
                <PosterLightbox
                  src={series.primaryImage?.url || "/placeholder.svg?height=600&width=400&query=tv series poster"}
                  alt={series.title}
                  className="aspect-[2/3] rounded-xl overflow-hidden shadow-2xl border border-border"
                >
                  <Image
                    src={series.primaryImage?.url || "/placeholder.svg?height=600&width=400&query=tv series poster"}
                    alt={series.title}
                    width={300}
                    height={450}
                    className="w-full h-full object-cover"
                  />
                </PosterLightbox>
                <WatchlistButton contentId={series.imdb_id} className="w-full mt-4" />
              </div>
            </div>

            {/* Info */}
            <div className="space-y-6">
              {/* Title & Meta */}
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded uppercase">
                    <Tv className="w-3 h-3 inline mr-1" />
                    TV Series
                  </span>
                  {series.quality && (
                    <span className="px-3 py-1 bg-secondary text-foreground text-xs font-bold rounded">
                      {series.quality}
                    </span>
                  )}
                </div>
                <h1 className="text-3xl lg:text-5xl font-bold text-foreground mb-4">{series.title}</h1>

                {/* Meta Info */}
                <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                  {series.rating && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/20 rounded-lg">
                      <Star className="w-5 h-5 text-primary fill-primary" />
                      <span className="font-bold text-primary text-lg">
                        {formatRating(series.rating.aggregateRating)}
                      </span>
                      <span className="text-sm">/ 10</span>
                      <span className="text-xs ml-1">({formatVoteCount(series.rating.voteCount)} votes)</span>
                    </div>
                  )}
                  {series.startYear && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      <span>{series.startYear}</span>
                    </div>
                  )}
                  {series.runtimeSeconds && (
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      <span>{formatRuntime(series.runtimeSeconds)} / episode</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Genres */}
              <div className="flex flex-wrap gap-2">
                {series.genres.map((genre) => (
                  <Link
                    key={genre}
                    href={`/genre/${genre.toLowerCase()}`}
                    className="px-4 py-1.5 bg-secondary/80 hover:bg-secondary text-foreground text-sm rounded-full transition-colors"
                  >
                    {genre}
                  </Link>
                ))}
              </div>

              {/* Plot */}
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-2">Synopsis</h2>
                <p className="text-muted-foreground leading-relaxed">{series.plot}</p>
              </div>

              {/* Mobile Watchlist Button */}
              <div className="lg:hidden">
                <WatchlistButton contentId={series.imdb_id} className="w-full" />
              </div>

              {/* People */}
              {series.directors && series.directors.length > 0 && (
                <div className="pt-4">
                  <CastSection cast={series.directors} title="Directors" />
                </div>
              )}
              {series.writers && series.writers.length > 0 && (
                <div className="pt-4">
                  <CastSection cast={series.writers} title="Writers" />
                </div>
              )}

              {/* Cast */}
              {series.stars && series.stars.length > 0 && (
                <div className="pt-4">
                  <CastSection cast={series.stars} />
                </div>
              )}

              {/* Video Player */}
              {series.primaryVideo && Object.values(series.primaryVideo).some(Boolean) && (
                <div className="pt-4">
                  <h2 className="text-xl font-bold text-foreground mb-4">Watch Now</h2>
                  <div className="max-w-5xl mx-auto w-full">
                    <SeriesWatchSection
                      imdbId={series.imdb_id}
                      tmdbId={series.tmdb_id}
                      title={series.title}
                      sources={series.primaryVideo}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <RelatedContentSection
            currentImdbId={series.imdb_id}
            pbType="serie"
            title="More Like This"
            genreIds={series.genreIds}
            genreNames={series.genres}
            countryIds={series.countryIds}
            currentRating={series.rating?.aggregateRating}
            allHref="/series"
          />
        </div>
      </div>

      <Footer />
    </main>
  )
}
