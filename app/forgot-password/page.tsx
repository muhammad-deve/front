"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Play, Loader2 } from "lucide-react"

function isEmailValid(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    const normalizedEmail = email.trim().toLowerCase()
    if (!isEmailValid(normalizedEmail)) {
      setError("Please enter a valid email address")
      return
    }

    setIsLoading(true)
    try {
      const checkRes = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
      }).catch(() => null)

      if (!checkRes || !checkRes.ok) {
        setError("Unable to validate email. Please try again.")
        return
      }

      const checkJson = (await checkRes.json().catch(() => null)) as { exists?: unknown } | null
      if (checkJson?.exists !== true) {
        setError("Account not found")
        return
      }

      const otpRes = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail, purpose: "reset" }),
      }).catch(() => null)

      if (!otpRes) {
        setError("An error occurred. Please try again.")
        return
      }
      if (!otpRes.ok) {
        const json = (await otpRes.json().catch(() => null)) as { error?: unknown } | null
        const message =
          typeof json?.error === "string" && json.error.trim() ? json.error.trim() : "Failed to send verification code"
        setError(message)
        return
      }

      router.push(`/forgot-password/verify?email=${encodeURIComponent(normalizedEmail)}`)
    } catch {
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <Header />
      <div className="min-h-screen flex items-center justify-center px-4 pt-16">
        <div className="w-full max-w-md">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 rounded-2xl blur-xl opacity-50" />
            <div className="relative bg-card border border-border rounded-2xl p-8 shadow-2xl">
              <div className="flex justify-center mb-8">
                <Link href="/" className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                    <Play className="w-6 h-6 text-primary-foreground fill-primary-foreground" />
                  </div>
                  <span className="text-2xl font-bold text-foreground">StreamVault</span>
                </Link>
              </div>

              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-foreground mb-2">Forgot your password?</h1>
                <p className="text-muted-foreground">Enter your email and we&apos;ll send a verification code</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-secondary border-border focus:ring-primary focus:border-primary"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold h-11"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Sending code...
                    </>
                  ) : (
                    "Send verification code"
                  )}
                </Button>
              </form>

              <p className="text-center text-muted-foreground mt-8">
                Remember your password?{" "}
                <Link href="/sign-in" className="text-primary font-medium hover:underline">
                  Back to sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
