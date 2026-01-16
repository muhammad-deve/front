import type React from "react"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { listGenres } from "@/lib/pb"
import { getGenreCountsCached } from "@/lib/genre-counts"
import {
  Layers,
  Zap,
  Map,
  Search,
  Users,
  Sparkles,
  Ghost,
  Eye,
  Heart,
  Rocket,
  AlertTriangle,
  Camera,
  User,
  Skull,
  Lock,
  Film,
  Music,
  Landmark,
  Moon,
  Trophy,
  Theater,
  Laugh,
  Wand2,
  Swords,
  Tv,
  Newspaper,
  Scissors,
  Gamepad2,
  Mic2,
  Sun,
} from "lucide-react"

// Genre descriptions
const genreDescriptions: Record<string, string> = {
  Action: "High-octane thrills with explosive stunts and intense combat sequences",
  Adventure: "Epic journeys through uncharted territories and exciting discoveries",
  Comedy: "Laugh-out-loud entertainment that brightens your day",
  Crime: "Gripping tales of criminals, detectives, and the pursuit of justice",
  Drama: "Emotionally powerful stories that explore the human condition",
  Fantasy: "Magical worlds filled with mythical creatures and extraordinary powers",
  Horror: "Spine-chilling experiences that will keep you on the edge of your seat",
  Mystery: "Intriguing puzzles and suspenseful investigations",
  Romance: "Heartwarming love stories that capture the essence of relationships",
  "Sci-Fi": "Futuristic adventures exploring technology and the unknown",
  Thriller: "Heart-pounding suspense that keeps you guessing until the end",
  Documentary: "Real-world stories that inform, inspire, and enlighten",
}

// Genre icons/emojis for visual interest
const genreIcons: Record<string, (props: { className?: string }) => React.ReactElement> = {
  Action: (p) => <Zap {...p} />,
  Adventure: (p) => <Map {...p} />,
  Comedy: (p) => <Laugh {...p} />,
  Crime: (p) => <Search {...p} />,
  Drama: (p) => <Theater {...p} />,
  Family: (p) => <Users {...p} />,
  Fantasy: (p) => <Wand2 {...p} />,
  Horror: (p) => <Skull {...p} />,
  Mystery: (p) => <Eye {...p} />,
  Romance: (p) => <Heart {...p} />,
  "Sci-Fi": (p) => <Rocket {...p} />,
  Thriller: (p) => <AlertTriangle {...p} />,
  Documentary: (p) => <Camera {...p} />,
  Biography: (p) => <User {...p} />,
  Animation: (p) => <Sparkles {...p} />,
  Adult: (p) => <Lock {...p} />,
  History: (p) => <Landmark {...p} />,
  War: (p) => <Swords {...p} />,
  Music: (p) => <Music {...p} />,
  "Film-Noir": (p) => <Moon {...p} />,
  Sport: (p) => <Trophy {...p} />,
  Western: (p) => <Sun {...p} />,
  Reality: (p) => <Tv {...p} />,
  Musical: (p) => <Mic2 {...p} />,
  "Talk-Show": (p) => <Users {...p} />,
  News: (p) => <Newspaper {...p} />,
  Short: (p) => <Scissors {...p} />,
  "Game-Show": (p) => <Gamepad2 {...p} />,
  "TV Movie": (p) => <Film {...p} />,
  "Sci Fi": (p) => <Rocket {...p} />,
  "Science Fiction": (p) => <Rocket {...p} />,
  "SciFi": (p) => <Rocket {...p} />,
  "Film Noir": (p) => <Moon {...p} />,
  "Noir": (p) => <Moon {...p} />,
  "Supernatural": (p) => <Ghost {...p} />,
}

export default async function GenresPage() {
	const genres = await listGenres()
	const countByID = await getGenreCountsCached()

  return (
    <main className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 pt-24 lg:pt-32 pb-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
            <Layers className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Browse by Genre</h1>
            <p className="text-muted-foreground">Discover content across {genres.length} different genres</p>
          </div>
        </div>

        {/* Genre Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {genres.map((genre) => {
            const count = countByID[genre.id] || 0
            const Icon = genreIcons[genre.name] || ((p: { className?: string }) => <Film {...p} />)

            return (
              <Link
                key={genre.id}
                href={`/genre/${genre.name.toLowerCase()}`}
                className="group relative overflow-hidden rounded-xl bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <span className="px-2 py-1 bg-secondary text-muted-foreground text-xs font-medium rounded">
                      {count} titles
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors mb-2">{genre.name}</h2>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {genreDescriptions[genre.name] || "Explore amazing content in this genre"}
                  </p>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/0 via-primary to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            )
          })}
        </div>
      </div>

      <Footer />
    </main>
  )
}
