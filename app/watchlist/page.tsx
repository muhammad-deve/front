"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ContentCard } from "@/components/content-card"
import { useAuth } from "@/components/auth-provider"
import { allContent } from "@/lib/mock-data"
import { Heart, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function WatchlistPage() {
  const { user, isAuthenticated } = useAuth()

  const watchlistContent = allContent.filter((c) => user?.watchlist.includes(c.imdb_id))

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 pt-24 lg:pt-32 pb-8">
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
              <LogIn className="w-10 h-10 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Sign in to view your list</h1>
            <p className="text-muted-foreground mb-6">Create an account to save your favorite movies and series</p>
            <div className="flex items-center justify-center gap-4">
              <Button asChild variant="secondary">
                <Link href="/sign-in">Sign In</Link>
              </Button>
              <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Link href="/sign-up">Create Account</Link>
              </Button>
            </div>
          </div>
        </div>
        <Footer />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 pt-24 lg:pt-32 pb-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
            <Heart className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">My List</h1>
            <p className="text-muted-foreground">
              {watchlistContent.length} item{watchlistContent.length !== 1 ? "s" : ""} saved
            </p>
          </div>
        </div>

        {/* Content Grid */}
        {watchlistContent.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 lg:gap-6">
            {watchlistContent.map((content) => (
              <ContentCard key={content.imdb_id} content={content} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Your list is empty</h2>
            <p className="text-muted-foreground mb-6">Start adding movies and series to your watchlist</p>
            <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Link href="/">Browse Content</Link>
            </Button>
          </div>
        )}
      </div>

      <Footer />
    </main>
  )
}
