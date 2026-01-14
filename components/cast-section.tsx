import Image from "next/image"
import Link from "next/link"
import type { Person } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface CastSectionProps {
  cast: Person[]
  title?: string
}

function toLabel(s: string): string {
	const t = s.trim().toLowerCase()
	if (!t) return s
	if (t === "actor") return "Actor"
	if (t === "director") return "Director"
	if (t === "writer") return "Writer"
	if (t === "producer") return "Producer"
	return t.replace(/\b\w/g, (c) => c.toUpperCase())
}

export function CastSection({ cast, title = "Cast" }: CastSectionProps) {
  if (!cast || cast.length === 0) return null

  return (
    <section>
      <h2 className="text-xl font-bold text-foreground mb-4">{title}</h2>
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {cast.map((person) => {
          const professions = person.professions || []
          return (
            <Dialog key={person.id}>
              <DialogTrigger asChild>
                <button type="button" className="flex-shrink-0 text-center w-24 group">
                  <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-2 bg-muted border border-border group-hover:border-primary/60 transition-colors">
                    <Image
                      src={person.primaryImage?.url || "/placeholder.svg?height=100&width=100&query=actor portrait"}
                      alt={person.displayName}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform"
                    />
                  </div>
                  <p className="text-sm text-foreground font-medium truncate">{person.displayName}</p>
                </button>
              </DialogTrigger>

              <DialogContent className="sm:max-w-xl p-0 overflow-hidden">
                <div className="relative bg-muted aspect-square">
                  <Image
                    src={person.primaryImage?.url || "/placeholder.svg?height=800&width=800&query=person portrait"}
                    alt={person.displayName}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-6">
                  <DialogHeader>
                    <DialogTitle className="text-2xl">{person.displayName}</DialogTitle>
                  </DialogHeader>

                  <div className="mt-2 text-sm text-muted-foreground">{title}</div>

                  {professions.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {professions.map((p) => (
                        <Badge key={p} variant="secondary">
                          {toLabel(p)}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="mt-6 flex flex-wrap gap-2">
                    <Button asChild variant="secondary">
                      <Link href={`/person/${encodeURIComponent(person.id)}`}>View filmography</Link>
                    </Button>
                    {person.primaryImage?.url && (
                      <Button asChild variant="outline">
                        <a href={person.primaryImage.url} target="_blank" rel="noreferrer">
                          Open full image
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )
        })}
      </div>
    </section>
  )
}
