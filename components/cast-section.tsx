import Image from "next/image"
import Link from "next/link"
import type { Person } from "@/lib/types"

interface CastSectionProps {
  cast: Person[]
  title?: string
}

export function CastSection({ cast, title = "Cast" }: CastSectionProps) {
  if (!cast || cast.length === 0) return null

  return (
    <section>
      <h2 className="text-xl font-bold text-foreground mb-4">{title}</h2>
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {cast.map((person) => (
          <Link
            key={person.id}
            href={`/person/${encodeURIComponent(person.id)}`}
            className="flex-shrink-0 text-center w-24"
          >
            <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-2 bg-muted">
              <Image
                src={person.primaryImage?.url || "/placeholder.svg?height=100&width=100&query=actor portrait"}
                alt={person.displayName}
                width={80}
                height={80}
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-sm text-foreground font-medium truncate">{person.displayName}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}
