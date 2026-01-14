"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ChannelCard } from "@/components/channel-card"
import { mockChannels } from "@/lib/mock-data"
import type { Channel } from "@/lib/types"
import { Radio, X } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function LiveTVPage() {
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null)

  const categories = [...new Set(mockChannels.map((c) => c.category).filter(Boolean))]

  return (
    <main className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 pt-24 lg:pt-32 pb-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
            <Radio className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Live TV</h1>
            <p className="text-muted-foreground">{mockChannels.length} channels streaming live</p>
          </div>
        </div>

        {/* Active Player Modal */}
        {activeChannel && (
          <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-5xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-destructive text-destructive-foreground text-xs font-bold rounded">
                    <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                    LIVE
                  </div>
                  <h2 className="text-xl font-bold text-foreground">{activeChannel.name}</h2>
                  {activeChannel.quality && (
                    <span className="px-2 py-1 bg-secondary text-foreground text-xs font-bold rounded">
                      {activeChannel.quality}
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setActiveChannel(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-6 h-6" />
                </Button>
              </div>

              {/* Video Player */}
              <div className="aspect-video bg-black rounded-xl overflow-hidden border border-border">
                <iframe
                  src={activeChannel.url}
                  title={activeChannel.name}
                  className="w-full h-full"
                  allowFullScreen
                  allow="autoplay; encrypted-media"
                />
              </div>

              <div className="mt-4 flex items-center justify-between">
                <p className="text-muted-foreground">
                  Category: <span className="text-foreground">{activeChannel.category}</span>
                </p>
                <Button variant="secondary" onClick={() => setActiveChannel(null)}>
                  Close Player
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Channels by Category */}
        {categories.map((category) => (
          <section key={category} className="mb-12">
            <h2 className="text-xl font-bold text-foreground mb-4">{category}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {mockChannels
                .filter((c) => c.category === category)
                .map((channel) => (
                  <ChannelCard key={channel.id} channel={channel} onWatch={setActiveChannel} />
                ))}
            </div>
          </section>
        ))}
      </div>

      <Footer />
    </main>
  )
}
