"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Heart, Copy, Check, Github, MessageCircle, Share2, Bug, Send, X } from "lucide-react"

const BTC_ADDRESS = "bc1ql8ytce30meu7d3p439cvw533kv323c4c9r8d33"
const BITCOIN_URI = `bitcoin:${BTC_ADDRESS}`

// QR code generated via public API — styled with gold-on-dark colors
const QR_URL = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&format=png&margin=8&data=${encodeURIComponent(BITCOIN_URI)}`

function TelegramIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
        </svg>
    )
}

type ActiveForm = "feedback" | "bug" | null

export default function SupportUsPage() {
    const [copied, setCopied] = useState(false)
    const [activeForm, setActiveForm] = useState<ActiveForm>(null)
    const [formText, setFormText] = useState("")
    const [formSent, setFormSent] = useState(false)

    // Clipboard with fallback for non-HTTPS / older browsers
    const copyToClipboard = async () => {
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(BTC_ADDRESS)
            } else {
                // Fallback: create a temp input and use execCommand
                const el = document.createElement("textarea")
                el.value = BTC_ADDRESS
                el.style.cssText = "position:fixed;top:-9999px;left:-9999px;opacity:0"
                document.body.appendChild(el)
                el.select()
                document.execCommand("copy")
                document.body.removeChild(el)
            }
            setCopied(true)
            setTimeout(() => setCopied(false), 2500)
        } catch (err) {
            console.error("Failed to copy:", err)
        }
    }

    // Web Share API with clipboard fallback
    const shareWithFriends = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: "StreamVault — Free Streaming Platform",
                    text: "Check out StreamVault! Free movies, TV series and live TV channels. No ads, no paywall.",
                    url: window.location.origin,
                })
            } catch {
                // user dismissed share sheet — that's fine
            }
        } else {
            // Fallback: copy the URL to clipboard
            try {
                await navigator.clipboard.writeText(window.location.origin)
                alert("Link copied to clipboard!")
            } catch {
                alert("Share this link: " + window.location.origin)
            }
        }
    }

    const openForm = (type: ActiveForm) => {
        setActiveForm(type)
        setFormText("")
        setFormSent(false)
    }

    const sendForm = () => {
        if (!formText.trim()) return
        // Build a Telegram link with pre-filled message
        const label = activeForm === "feedback" ? "[Feedback]" : "[Bug Report]"
        const msg = encodeURIComponent(`${label} ${formText}`)
        window.open(`https://t.me/deve_muhammad?text=${msg}`, "_blank", "noopener,noreferrer")
        setFormSent(true)
        setTimeout(() => {
            setActiveForm(null)
            setFormText("")
            setFormSent(false)
        }, 2000)
    }

    return (
        <main className="min-h-screen bg-background">
            <Header />

            {/* Hero */}
            <section className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />
                <div className="absolute top-32 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

                <div className="relative container mx-auto px-4 pt-28 lg:pt-36 pb-12">
                    <div className="max-w-2xl mx-auto text-center">
                        <div className="w-20 h-20 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-6 ring-4 ring-primary/10">
                            <Heart className="w-10 h-10 text-primary" />
                        </div>
                        <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-4">
                            Support <span className="text-primary">StreamVault</span>
                        </h1>
                        <p className="text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed">
                            StreamVault is completely free and always will be. Your support helps us keep the
                            lights on and continue improving the platform.
                        </p>
                    </div>
                </div>
            </section>

            {/* Bitcoin Donation Card */}
            <section className="container mx-auto px-4 pb-12">
                <div className="max-w-2xl mx-auto">
                    <div className="bg-card border border-border rounded-2xl p-8 lg:p-10 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />

                        <div className="relative">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-[#f7931a]/20 flex items-center justify-center">
                                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-[#f7931a]">
                                        <path d="M23.638 14.904c-1.602 6.43-8.113 10.34-14.542 8.736C2.67 22.05-1.244 15.525.362 9.105 1.962 2.67 8.475-1.243 14.9.358c6.43 1.605 10.342 8.115 8.738 14.546z" />
                                        <path d="M17.04 10.274c.228-1.532-.934-2.352-2.526-2.902l.516-2.072-1.26-.315-.503 2.016c-.331-.083-.672-.16-1.01-.238l.506-2.027-1.26-.314-.517 2.07c-.275-.062-.544-.124-.805-.19l.001-.007-1.738-.435-.335 1.346s.934.215.915.228c.51.128.603.466.587.734l-.589 2.362c.035.009.081.022.131.043l-.133-.033-.825 3.31c-.063.155-.222.387-.58.299.013.019-.916-.229-.916-.229l-.625 1.444 1.64.409c.306.077.605.157.9.233l-.522 2.097 1.259.314.517-2.074c.344.093.678.179 1.005.261l-.515 2.063 1.26.314.522-2.091c2.148.407 3.762.243 4.44-1.7.547-1.564-.027-2.466-1.157-3.054.823-.19 1.443-.731 1.609-1.849zm-2.879 4.036c-.389 1.564-3.02.718-3.874.506l.691-2.77c.854.213 3.59.636 3.183 2.264zm.389-4.057c-.354 1.422-2.543.7-3.254.522l.626-2.513c.711.178 2.997.509 2.628 1.991z" fill="#fff" />
                                    </svg>
                                </div>
                                <h2 className="text-xl font-bold text-foreground">Donate with Bitcoin</h2>
                            </div>

                            {/* Real QR Code — branded gold on dark */}
                            <div className="flex justify-center mb-8">
                                <div className="p-3 bg-white rounded-2xl border-2 border-primary/30 shadow-lg shadow-primary/10">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={QR_URL}
                                        alt="Bitcoin QR Code"
                                        width={260}
                                        height={260}
                                        className="rounded-xl block"
                                        style={{ imageRendering: "pixelated" }}
                                    />
                                </div>
                            </div>

                            {/* BTC Address */}
                            <div className="mb-6">
                                <label className="block text-sm text-muted-foreground mb-2 font-medium uppercase tracking-wide">
                                    Bitcoin Address
                                </label>
                                <div className="flex items-center gap-3 bg-secondary/80 rounded-xl p-4 border border-border">
                                    <code className="flex-1 text-sm font-mono text-foreground break-all select-all">
                                        {BTC_ADDRESS}
                                    </code>
                                    <button
                                        onClick={copyToClipboard}
                                        className="flex-shrink-0 w-9 h-9 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                                        title="Copy address"
                                    >
                                        {copied ? <Check className="w-5 h-5 text-primary" /> : <Copy className="w-5 h-5" />}
                                    </button>
                                </div>
                                {copied && (
                                    <p className="text-sm text-primary text-center mt-2">
                                        ✓ Address copied to clipboard!
                                    </p>
                                )}
                            </div>

                            {/* Copy Button */}
                            <Button
                                onClick={copyToClipboard}
                                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-12 text-base font-semibold rounded-xl"
                            >
                                {copied ? (
                                    <><Check className="w-5 h-5 mr-2" />Copied!</>
                                ) : (
                                    <><Copy className="w-5 h-5 mr-2" />Copy Bitcoin Address</>
                                )}
                            </Button>
                            <Button
                                asChild
                                variant="outline"
                                className="w-full mt-3 h-12 text-base font-semibold rounded-xl"
                            >
                                <a href={BITCOIN_URI}>Open in Bitcoin Wallet</a>
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Contact Section */}
            <section className="container mx-auto px-4 pb-12">
                <div className="max-w-2xl mx-auto">
                    <h2 className="text-2xl font-bold text-foreground mb-6 text-center">Get in Touch</h2>
                    <div className="grid sm:grid-cols-2 gap-4">
                        <a
                            href="https://t.me/deve_muhammad"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-center gap-4 bg-card border border-border rounded-2xl p-6 hover:border-primary/40 transition-all duration-300 hover:-translate-y-1"
                        >
                            <div className="w-12 h-12 rounded-xl bg-[#229ED9]/15 flex items-center justify-center group-hover:bg-[#229ED9]/25 transition-colors">
                                <TelegramIcon className="w-6 h-6 text-[#229ED9]" />
                            </div>
                            <div>
                                <p className="font-semibold text-foreground">Telegram</p>
                                <p className="text-sm text-muted-foreground">@deve_muhammad</p>
                            </div>
                        </a>
                        <a
                            href="https://github.com/muhammad-deve"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-center gap-4 bg-card border border-border rounded-2xl p-6 hover:border-primary/40 transition-all duration-300 hover:-translate-y-1"
                        >
                            <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center group-hover:bg-muted transition-colors">
                                <Github className="w-6 h-6 text-foreground" />
                            </div>
                            <div>
                                <p className="font-semibold text-foreground">GitHub</p>
                                <p className="text-sm text-muted-foreground">muhammad-deve</p>
                            </div>
                        </a>
                    </div>
                </div>
            </section>

            {/* Other Ways */}
            <section className="container mx-auto px-4 pb-12">
                <div className="max-w-2xl mx-auto">
                    <h2 className="text-2xl font-bold text-foreground mb-6 text-center">Other Ways to Help</h2>
                    <div className="grid sm:grid-cols-3 gap-4">
                        {/* Share with Friends */}
                        <button
                            onClick={shareWithFriends}
                            className="group bg-card border border-border rounded-2xl p-6 text-center hover:border-primary/40 transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                        >
                            <Share2 className="w-8 h-8 text-primary mx-auto mb-3 group-hover:scale-110 transition-transform" />
                            <p className="font-medium text-foreground text-sm">Share with Friends</p>
                            <p className="text-xs text-muted-foreground mt-1">Spread the word about StreamVault</p>
                        </button>

                        {/* Give Feedback */}
                        <button
                            onClick={() => openForm("feedback")}
                            className="group bg-card border border-border rounded-2xl p-6 text-center hover:border-primary/40 transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                        >
                            <MessageCircle className="w-8 h-8 text-primary mx-auto mb-3 group-hover:scale-110 transition-transform" />
                            <p className="font-medium text-foreground text-sm">Give Feedback</p>
                            <p className="text-xs text-muted-foreground mt-1">Tell us how we can improve</p>
                        </button>

                        {/* Report Bug */}
                        <button
                            onClick={() => openForm("bug")}
                            className="group bg-card border border-border rounded-2xl p-6 text-center hover:border-primary/40 transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                        >
                            <Bug className="w-8 h-8 text-primary mx-auto mb-3 group-hover:scale-110 transition-transform" />
                            <p className="font-medium text-foreground text-sm">Report Bugs</p>
                            <p className="text-xs text-muted-foreground mt-1">Help us squash those bugs</p>
                        </button>
                    </div>
                </div>
            </section>

            {/* Inline Form Modal (Feedback / Bug Report) */}
            {activeForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className="w-full max-w-lg bg-card border border-border rounded-2xl p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                                    {activeForm === "feedback"
                                        ? <MessageCircle className="w-5 h-5 text-primary" />
                                        : <Bug className="w-5 h-5 text-primary" />
                                    }
                                </div>
                                <h3 className="text-lg font-bold text-foreground">
                                    {activeForm === "feedback" ? "Give Feedback" : "Report a Bug"}
                                </h3>
                            </div>
                            <button
                                onClick={() => setActiveForm(null)}
                                className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <p className="text-sm text-muted-foreground mb-4">
                            {activeForm === "feedback"
                                ? "Share your thoughts, suggestions, or ideas. We read everything!"
                                : "Describe the bug you found — what happened and how to reproduce it."
                            }
                        </p>

                        <textarea
                            value={formText}
                            onChange={(e) => setFormText(e.target.value)}
                            placeholder={
                                activeForm === "feedback"
                                    ? "I think it would be great if..."
                                    : "When I click on... the page shows..."
                            }
                            className="w-full h-36 bg-secondary/80 border border-border rounded-xl p-4 text-foreground text-sm placeholder:text-muted-foreground/60 resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                            autoFocus
                        />

                        <p className="text-xs text-muted-foreground mt-2 mb-4">
                            This will open Telegram with your message pre-filled to send directly to us.
                        </p>

                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => setActiveForm(null)}
                            >
                                Cancel
                            </Button>
                            <Button
                                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                                onClick={sendForm}
                                disabled={!formText.trim() || formSent}
                            >
                                {formSent ? (
                                    <><Check className="w-4 h-4 mr-2" />Sent!</>
                                ) : (
                                    <><Send className="w-4 h-4 mr-2" />Send via Telegram</>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Thank you */}
            <section className="container mx-auto px-4 pb-16">
                <div className="max-w-2xl mx-auto text-center">
                    <p className="text-muted-foreground leading-relaxed">
                        Every contribution — whether it&apos;s a donation, a bug report, or simply sharing StreamVault
                        with a friend — makes a real difference. Thank you for being part of this journey. ❤️
                    </p>
                </div>
            </section>

            <Footer />
        </main>
    )
}
