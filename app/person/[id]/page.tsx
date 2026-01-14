import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ContentCarousel } from "@/components/content-carousel"
import { Badge } from "@/components/ui/badge"
import { PersonPortraitLightbox } from "@/components/person-portrait-lightbox"
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
          <PersonPortraitLightbox src={person.primaryImage?.url} alt={person.displayName} />

          <div className="flex-1">
            <h1 className="text-3xl lg:text-4xl font-bold text-foreground">{person.displayName}</h1>

					{person.professions && person.professions.length > 0 && (
						<div className="mt-3 flex flex-wrap gap-2">
							{person.professions.map((p) => (
								<Badge key={p} variant="secondary">
									{p}
								</Badge>
							))}
						</div>
					)}

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
