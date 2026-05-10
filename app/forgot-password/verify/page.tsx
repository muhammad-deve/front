"use client"

import type React from "react"
import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { Play, Loader2 } from "lucide-react"

function isEmailValid(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function ForgotPasswordVerifyContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = (searchParams.get("email") || "").trim().toLowerCase()

  const [code, setCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [resendCountdown, setResendCountdown] = useState(60)

  useEffect(() => {
    if (resendCountdown <= 0) return
    const timer = setTimeout(() => setResendCountdown((v) => v - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendCountdown])

  if (!isEmailValid(email)) {
    return (
      <main className="min-h-screen bg-background">
        <Header />
        <div className="min-h-screen flex items-center justify-center px-4 pt-16">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 text-center">
            <h1 className="text-xl font-bold text-foreground mb-2">Invalid reset link</h1>
            <p className="text-muted-foreground mb-6">Start password reset again and enter your email first.</p>
            <Button asChild className="w-full">
              <Link href="/forgot-password">Start again</Link>
            </Button>
          </div>
        </div>
      </main>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!/^\d{5}$/.test(code)) {
      setError("Please enter the 5-digit verification code")
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch("/api/auth/verify-reset-otp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, otp: code }),
      }).catch(() => null)

      if (!res) {
        setError("An error occurred. Please try again.")
        return
      }
      if (!res.ok) {
        const json = (await res.json().catch(() => null)) as { error?: unknown } | null
        const message =
          typeof json?.error === "string" && json.error.trim() ? json.error.trim() : "Invalid or expired code"
        setError(message)
        return
      }

      router.push(`/forgot-password/reset?email=${encodeURIComponent(email)}`)
    } catch {
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    setError("")
    setIsLoading(true)
    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, purpose: "reset" }),
      }).catch(() => null)

      if (!res || !res.ok) {
        const json = (res && (await res.json().catch(() => null))) as { error?: unknown } | null
        const message = typeof json?.error === "string" && json.error.trim() ? json.error.trim() : "Failed to resend code"
        setError(message)
        return
      }

      setResendCountdown(60)
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
                <h1 className="text-2xl font-bold text-foreground mb-2">Check your email</h1>
                <p className="text-muted-foreground">
                  Enter the 5-digit code sent to
                  <br />
                  <span className="text-foreground font-medium">{email}</span>
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                    {error}
                  </div>
                )}

                <div className="flex justify-center">
                  <InputOTP maxLength={5} value={code} onChange={(value) => setCode(value)}>
                    <InputOTPGroup>
                      {[0, 1, 2, 3, 4].map((i) => (
                        <InputOTPSlot key={i} index={i} />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <div className="text-center">
                  {resendCountdown > 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Resend code in <span className="text-primary font-medium">{resendCountdown}s</span>
                    </p>
                  ) : (
                    <button type="button" onClick={handleResend} className="text-sm text-primary hover:underline font-medium">
                      Resend code
                    </button>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || !/^\d{5}$/.test(code)}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold h-11"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify code"
                  )}
                </Button>
              </form>

              <p className="text-center text-muted-foreground mt-8">
                Wrong email?{" "}
                <Link href="/forgot-password" className="text-primary font-medium hover:underline">
                  Go back
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export default function ForgotPasswordVerifyPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-background" />}>
      <ForgotPasswordVerifyContent />
    </Suspense>
  )
}
