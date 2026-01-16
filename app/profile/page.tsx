"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ContentCard } from "@/components/content-card"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import type { Content } from "@/lib/types"
import { getContentByImdb } from "@/lib/pb"
import { User as UserIcon, Mail, Heart, LogOut, LogIn, ChevronRight } from "lucide-react"

function initials(firstName?: string, lastName?: string): string {
  const a = (firstName || "").trim()
  const b = (lastName || "").trim()
  const i1 = a ? a[0]!.toUpperCase() : "U"
  const i2 = b ? b[0]!.toUpperCase() : ""
  return (i1 + i2).trim() || "U"
}

export default function ProfilePage() {
  const { user, isAuthenticated, signOut } = useAuth()
  const [watchlistContent, setWatchlistContent] = useState<Content[]>([])
  const [isLoadingList, setIsLoadingList] = useState(false)

  const name = useMemo(() => {
    const first = (user?.firstName || "").trim()
    const last = (user?.lastName || "").trim()
    return `${first} ${last}`.trim() || "User"
  }, [user?.firstName, user?.lastName])

  useEffect(() => {
    let cancelled = false
    const ids = user?.watchlist || []

    if (!isAuthenticated || ids.length === 0) {
      setWatchlistContent([])
      return
    }

    setIsLoadingList(true)
    Promise.all(ids.slice(0, 24).map((id) => getContentByImdb(id)))
      .then((items) => {
        if (cancelled) return
        setWatchlistContent(items.filter(Boolean) as Content[])
      })
      .finally(() => {
        if (cancelled) return
        setIsLoadingList(false)
      })

    return () => {
      cancelled = true
    }
  }, [isAuthenticated, user?.watchlist])

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 pt-24 lg:pt-32 pb-8">
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
              <LogIn className="w-10 h-10 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Sign in to view your profile</h1>
            <p className="text-muted-foreground mb-6">Manage your account and see your saved list</p>
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

  const watchlistCount = user?.watchlist?.length || 0

  return (
    <main className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 pt-24 lg:pt-32 pb-8">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent" />
          <div className="relative p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                  <span className="text-xl font-extrabold text-primary-foreground">{initials(user?.firstName, user?.lastName)}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-3xl font-bold text-foreground">{name}</h1>
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/15 text-primary">Premium</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mt-1">
                    <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                      <UserIcon className="w-4 h-4" />
                      Account
                    </div>
                    <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="w-4 h-4" />
                      {user?.email}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button asChild variant="secondary" className="gap-2">
                  <Link href="/watchlist">
                    <Heart className="w-4 h-4" />
                    My List
                  </Link>
                </Button>
                <Button onClick={signOut} className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
              <Card className="border-border bg-background/40">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-foreground">Saved to My List</CardTitle>
                  <CardDescription>Your watchlist items</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end justify-between">
                    <div className="text-3xl font-extrabold text-foreground">{watchlistCount}</div>
                    <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                      <Heart className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-background/40">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-foreground">Account Status</CardTitle>
                  <CardDescription>Security & access</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-3xl font-extrabold text-foreground">Active</div>
                      <div className="text-sm text-muted-foreground mt-1">Signed in</div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                      <UserIcon className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-background/40">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-foreground">Quick actions</CardTitle>
                  <CardDescription>Jump back into browsing</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                    <Link href="/">
                      Browse Content
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 mt-10 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Heart className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">My List</h2>
              <p className="text-muted-foreground">Your saved movies & series</p>
            </div>
          </div>
          <Button asChild variant="secondary" className="gap-2">
            <Link href="/watchlist">View all</Link>
          </Button>
        </div>

        {isLoadingList ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        ) : watchlistContent.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 lg:gap-6">
            {watchlistContent.map((content) => (
              <ContentCard key={content.imdb_id} content={content} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border border-border bg-card rounded-2xl">
            <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Your list is empty</h3>
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
