"use client"

import Image from "next/image"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"

interface PersonPortraitLightboxProps {
  src?: string
  alt: string
}

export function PersonPortraitLightbox({ src, alt }: PersonPortraitLightboxProps) {
  const img = src && src.trim() ? src.trim() : "/placeholder.svg?height=256&width=256&query=person portrait"

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-muted border border-border flex-shrink-0 block"
        >
          <Image
            src={img}
            alt={alt}
            width={128}
            height={128}
            className="w-full h-full object-cover"
          />
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-4xl p-0 overflow-hidden">
        <div className="relative bg-muted aspect-square">
          <Image src={img} alt={alt} fill className="object-cover" />
        </div>
      </DialogContent>
    </Dialog>
  )
}
