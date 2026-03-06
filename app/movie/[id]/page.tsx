import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { VideoPlayer } from "@/components/video-player"
import { CastSection } from "@/components/cast-section"
import { ContentCarousel } from "@/components/content-carousel"
import { RelatedContentSection } from "@/components/related-content-section"
import { PosterLightbox } from "@/components/poster-lightbox"
import { getContentByImdb } from "@/lib/pb"
import { formatRuntime, formatRating, formatVoteCount } from "@/lib/utils"
import { Star, Calendar, Clock, Globe } from "lucide-react"
import { WatchlistButton } from "@/components/watchlist-button"

interface MoviePageProps {
  params: Promise<{ id: string }>
}

export default async function MoviePage({ params }: MoviePageProps) {
  const { id } = await params
  const movie = await getContentByImdb(id)

  if (!movie || movie.type !== "movie") {
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
        <div className="relative mx-auto w-full max-w-7xl 2xl:max-w-[1600px] px-4 pt-24 lg:pt-32">
          <div className="grid lg:grid-cols-[300px_1fr] gap-8 items-start">
            {/* Poster */}
            <div className="hidden lg:block self-start sticky top-24">
              <PosterLightbox
                src={movie.primaryImage?.url || "/placeholder.svg?height=600&width=400&query=movie poster"}
                alt={movie.title}
                className="aspect-[2/3] rounded-xl overflow-hidden shadow-2xl border border-border"
              >
                <Image
                  src={movie.primaryImage?.url || "/placeholder.svg?height=600&width=400&query=movie poster"}
                  alt={movie.title}
                  width={300}
                  height={450}
                  className="w-full h-full object-cover"
                />
              </PosterLightbox>
              <WatchlistButton contentId={movie.imdb_id} className="w-full mt-4" />
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

              {/* People */}
              {movie.directors && movie.directors.length > 0 && (
                <div className="pt-4">
                  <CastSection cast={movie.directors} title="Directors" />
                </div>
              )}
              {movie.writers && movie.writers.length > 0 && (
                <div className="pt-4">
                  <CastSection cast={movie.writers} title="Writers" />
                </div>
              )}

              {/* Cast */}
              {movie.stars && movie.stars.length > 0 && (
                <div className="pt-4">
                  <CastSection cast={movie.stars} />
                </div>
              )}

              {/* Video Player */}
              {movie.primaryVideo && Object.values(movie.primaryVideo).some(Boolean) && (
                <div className="pt-4">
                  <h2 className="text-xl font-bold text-foreground mb-4">Watch Now</h2>
                  <div className="max-w-5xl mx-auto w-full">
                    <VideoPlayer sources={movie.primaryVideo} title={movie.title} />
                  </div>
                </div>
              )}
            </div>
          </div>

          <RelatedContentSection
            currentImdbId={movie.imdb_id}
            pbType="movie"
            title="More Like This"
            genreIds={movie.genreIds}
            genreNames={movie.genres}
            countryIds={movie.countryIds}
            currentRating={movie.rating?.aggregateRating}
            allHref="/movies"
          />
        </div>
      </div>

      <Footer />
    </main>
  )
}
