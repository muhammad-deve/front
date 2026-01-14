import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ContentCarousel } from "@/components/content-carousel"
import { getPersonById, listContentByPersonCredits } from "@/lib/pb"

interface PersonPageProps {
  params: Promise<{ id: string }>
}

export default async function PersonPage({ params }: PersonPageProps) {
  const { id } = await params
  const personResp = await getPersonById(id)
  if (!personResp) notFound()

  const { person, movieIds } = personResp
  const items = await listContentByPersonCredits({ movieIds })

  return (
    <main className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 pt-24 lg:pt-32 pb-12">
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-muted border border-border flex-shrink-0">
            <Image
              src={person.primaryImage?.url || "/placeholder.svg?height=256&width=256&query=person portrait"}
              alt={person.displayName}
              width={128}
              height={128}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1">
            <h1 className="text-3xl lg:text-4xl font-bold text-foreground">{person.displayName}</h1>
            <div className="mt-3 text-sm text-muted-foreground">
              <Link href="/" className="hover:text-foreground transition-colors">
                Home
              </Link>
              <span className="mx-2">/</span>
              <span className="text-foreground">{person.displayName}</span>
            </div>
          </div>
        </div>

        <div className="mt-10 space-y-10">
          {items.length > 0 ? (
            <ContentCarousel title="Participated In" items={items} />
          ) : (
            <div className="text-muted-foreground">No titles found for this person.</div>
          )}
        </div>
      </div>

      <Footer />
    </main>
  )
}
