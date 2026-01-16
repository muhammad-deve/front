import Image from "next/image"
import Link from "next/link"
import type { Person } from "@/lib/types"

interface CastSectionProps {
  cast: Person[]
  title?: string
  maxVisible?: number
}

export function CastSection({ cast, title = "Cast", maxVisible = 12 }: CastSectionProps) {
  if (!cast || cast.length === 0) return null

  const displayedCast = cast.slice(0, maxVisible)
  const remainingCount = cast.length - maxVisible

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
        {remainingCount > 0 && (
          <span className="text-sm text-muted-foreground">
            +{remainingCount} more
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-3">
        {displayedCast.map((person) => (
          <Link
            key={person.id}
            href={`/person/${encodeURIComponent(person.id)}`}
            className="flex items-center gap-3 px-3 py-2 rounded-xl bg-secondary/50 hover:bg-secondary border border-border hover:border-primary/30 transition-all duration-200 group"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-muted border-2 border-border group-hover:border-primary/50 transition-colors flex-shrink-0">
              <Image
                src={person.primaryImage?.url || "/placeholder.svg?height=100&width=100&query=actor portrait"}
                alt={person.displayName}
                width={48}
                height={48}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate max-w-[120px] sm:max-w-[150px] group-hover:text-primary transition-colors">
                {person.displayName}
              </p>
              {person.professions && person.professions.length > 0 && (
                <p className="text-xs text-muted-foreground truncate max-w-[120px] sm:max-w-[150px] capitalize">
                  {person.professions[0]}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

