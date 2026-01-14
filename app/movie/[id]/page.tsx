import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { VideoPlayer } from "@/components/video-player"
import { CastSection } from "@/components/cast-section"
import { ContentCarousel } from "@/components/content-carousel"
import { allContent, mockMovies } from "@/lib/mock-data"
import { formatRuntime, formatRating, formatVoteCount } from "@/lib/utils"
import { Star, Calendar, Clock, Globe } from "lucide-react"
import { WatchlistButton } from "@/components/watchlist-button"

interface MoviePageProps {
  params: Promise<{ id: string }>
}

export default async function MoviePage({ params }: MoviePageProps) {
  const { id } = await params
  const movie = allContent.find((c) => c.imdb_id === id && c.type === "movie")

  if (!movie) {
    notFound()
  }

  // Get related movies by genre
  const relatedMovies = mockMovies
    .filter((m) => m.imdb_id !== movie.imdb_id && m.genres.some((g) => movie.genres.includes(g)))
    .slice(0, 10)

  return (
    <main className="min-h-screen bg-background">
      <Header />

      {/* Hero Background */}
      <div className="relative">
        <div className="absolute inset-0 h-[60vh]">
          <Image
            src={
              movie.backdropImage?.url ||
              movie.primaryImage?.url ||
              "/placeholder.svg?height=1080&width=1920&query=cinematic movie scene" ||
              "/placeholder.svg"
            }
            alt={movie.title}
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/50 to-transparent" />
        </div>

        {/* Content */}
        <div className="relative container mx-auto px-4 pt-24 lg:pt-32">
          <div className="grid lg:grid-cols-[300px_1fr] gap-8">
            {/* Poster */}
            <div className="hidden lg:block">
              <div className="sticky top-24">
                <div className="aspect-[2/3] rounded-xl overflow-hidden shadow-2xl border border-border">
                  <Image
                    src={movie.primaryImage?.url || "/placeholder.svg?height=600&width=400&query=movie poster"}
                    alt={movie.title}
                    width={300}
                    height={450}
                    className="w-full h-full object-cover"
                  />
                </div>
                <WatchlistButton contentId={movie.imdb_id} className="w-full mt-4" />
              </div>
            </div>

            {/* Info */}
            <div className="space-y-6">
              {/* Title & Meta */}
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded uppercase">
                    Movie
                  </span>
                  {movie.quality && (
                    <span className="px-3 py-1 bg-secondary text-foreground text-xs font-bold rounded">
                      {movie.quality}
                    </span>
                  )}
                </div>
                <h1 className="text-3xl lg:text-5xl font-bold text-foreground mb-4">{movie.title}</h1>

                {/* Meta Info */}
                <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                  {movie.rating && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/20 rounded-lg">
                      <Star className="w-5 h-5 text-primary fill-primary" />
                      <span className="font-bold text-primary text-lg">
                        {formatRating(movie.rating.aggregateRating)}
                      </span>
                      <span className="text-sm">/ 10</span>
                      <span className="text-xs ml-1">({formatVoteCount(movie.rating.voteCount)} votes)</span>
                    </div>
                  )}
                  {movie.startYear && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      <span>{movie.startYear}</span>
                    </div>
                  )}
                  {movie.runtimeSeconds && (
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      <span>{formatRuntime(movie.runtimeSeconds)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Genres */}
              <div className="flex flex-wrap gap-2">
                {movie.genres.map((genre) => (
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
                <p className="text-muted-foreground leading-relaxed">{movie.plot}</p>
              </div>

              {/* Details */}
              <div className="grid sm:grid-cols-2 gap-4">
                {movie.directors && movie.directors.length > 0 && (
                  <div>
                    <h3 className="text-sm text-muted-foreground mb-1">Director</h3>
                    <p className="text-foreground">{movie.directors.map((d) => d.displayName).join(", ")}</p>
                  </div>
                )}
                {movie.writers && movie.writers.length > 0 && (
                  <div>
                    <h3 className="text-sm text-muted-foreground mb-1">Writers</h3>
                    <p className="text-foreground">{movie.writers.map((w) => w.displayName).join(", ")}</p>
                  </div>
                )}
                {movie.originCountries && movie.originCountries.length > 0 && (
                  <div className="flex items-start gap-2">
                    <Globe className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div>
                      <h3 className="text-sm text-muted-foreground mb-1">Country</h3>
                      <p className="text-foreground">{movie.originCountries.join(", ")}</p>
                    </div>
                  </div>
                )}
                {movie.spokenLanguages && movie.spokenLanguages.length > 0 && (
                  <div>
                    <h3 className="text-sm text-muted-foreground mb-1">Language</h3>
                    <p className="text-foreground">{movie.spokenLanguages.join(", ")}</p>
                  </div>
                )}
              </div>

              {/* Mobile Watchlist Button */}
              <div className="lg:hidden">
                <WatchlistButton contentId={movie.imdb_id} className="w-full" />
              </div>

              {/* Video Player */}
              {movie.primaryVideo && Object.values(movie.primaryVideo).some(Boolean) && (
                <div className="pt-4">
                  <h2 className="text-xl font-bold text-foreground mb-4">Watch Now</h2>
                  <VideoPlayer sources={movie.primaryVideo} title={movie.title} />
                </div>
              )}

              {/* Cast */}
              {movie.stars && movie.stars.length > 0 && (
                <div className="pt-4">
                  <CastSection cast={movie.stars} />
                </div>
              )}
            </div>
          </div>

          {/* Related Content */}
          {relatedMovies.length > 0 && (
            <div className="mt-16">
              <ContentCarousel title="More Like This" items={relatedMovies} />
            </div>
          )}
        </div>
      </div>

      <Footer />
    </main>
  )
}
