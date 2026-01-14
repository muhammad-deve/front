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
      <div className="flex flex-nowrap gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {cast.map((person) => {
          return (
            <Link
              key={person.id}
              href={`/person/${encodeURIComponent(person.id)}`}
              className="flex-shrink-0 text-center w-20 sm:w-24 group"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden mx-auto mb-2 bg-muted border border-border group-hover:border-primary/60 transition-colors">
                <Image
                  src={person.primaryImage?.url || "/placeholder.svg?height=100&width=100&query=actor portrait"}
                  alt={person.displayName}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform"
                />
              </div>
              <p className="text-sm text-foreground font-medium truncate">{person.displayName}</p>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
