import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ContentCard } from "@/components/content-card"
import { mockMovies } from "@/lib/mock-data"
import { Film } from "lucide-react"

export default function MoviesPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 pt-24 lg:pt-32 pb-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
            <Film className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Movies</h1>
            <p className="text-muted-foreground">Browse our collection of {mockMovies.length} movies</p>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 lg:gap-6">
          {mockMovies.map((movie) => (
            <ContentCard key={movie.imdb_id} content={movie} />
          ))}
        </div>
      </div>

      <Footer />
    </main>
  )
}
