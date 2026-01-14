"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Heart, Copy, Check, QrCode } from "lucide-react"

const BTC_ADDRESS = "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh"

export default function DonatePage() {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(BTC_ADDRESS)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 pt-24 lg:pt-32 pb-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
              <Heart className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">Support Our Platform</h1>
            <p className="text-muted-foreground text-lg max-w-md mx-auto">
              Help us keep the content free and ad-free. Your support means everything to us.
            </p>
          </div>

          {/* Donation Card */}
          <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">
            <h2 className="text-xl font-semibold text-foreground mb-6 text-center">Donate with Bitcoin</h2>

            {/* QR Code Placeholder */}
            <div className="flex justify-center mb-6">
              <div className="w-48 h-48 bg-secondary rounded-xl flex items-center justify-center border border-border">
                <QrCode className="w-24 h-24 text-muted-foreground" />
              </div>
            </div>

            {/* BTC Address */}
            <div className="mb-6">
              <label className="block text-sm text-muted-foreground mb-2 text-center">Bitcoin Address</label>
              <div className="flex items-center gap-2 bg-secondary rounded-lg p-4 border border-border">
                <code className="flex-1 text-sm font-mono text-foreground break-all">{BTC_ADDRESS}</code>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={copyToClipboard}
                  className="flex-shrink-0 text-muted-foreground hover:text-foreground"
                >
                  {copied ? <Check className="w-5 h-5 text-primary" /> : <Copy className="w-5 h-5" />}
                </Button>
              </div>
              {copied && <p className="text-sm text-primary text-center mt-2">Address copied to clipboard!</p>}
            </div>

            {/* Copy Button */}
            <Button onClick={copyToClipboard} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
              {copied ? (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5 mr-2" />
                  Copy Address
                </>
              )}
            </Button>
          </div>

          {/* Thank You Note */}
          <div className="text-center mt-8">
            <p className="text-muted-foreground">
              Thank you for considering a donation. Every contribution helps us maintain and improve the platform.
            </p>
          </div>

          {/* Other Ways to Support */}
          <div className="mt-12 text-center">
            <h3 className="text-lg font-semibold text-foreground mb-4">Other Ways to Support</h3>
            <div className="flex flex-wrap justify-center gap-4">
              <div className="px-6 py-3 bg-card border border-border rounded-lg">
                <p className="text-sm text-muted-foreground">Share with friends</p>
              </div>
              <div className="px-6 py-3 bg-card border border-border rounded-lg">
                <p className="text-sm text-muted-foreground">Follow us on social media</p>
              </div>
              <div className="px-6 py-3 bg-card border border-border rounded-lg">
                <p className="text-sm text-muted-foreground">Report bugs & issues</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
