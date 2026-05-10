"use client"

import type React from "react"
import { Suspense, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { Play, Loader2, Check, Eye, EyeOff } from "lucide-react"

function ForgotPasswordResetContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = (searchParams.get("email") || "").trim().toLowerCase()

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [isComplete, setIsComplete] = useState(false)

  const passwordRules = {
    length: password.length >= 8 && password.length <= 64,
    letter: /[A-Za-z]/.test(password),
    number: /\d/.test(password),
  }
  const isPasswordValid = passwordRules.length && passwordRules.letter && passwordRules.number
  const passwordsMatch = password === confirmPassword && confirmPassword !== ""

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!isPasswordValid) {
      setError("Your password doesn't meet the requirements")
      return
    }
    if (!passwordsMatch) {
      setError("Passwords do not match")
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          confirmPassword,
        }),
      }).catch(() => null)

      if (!res) {
        setError("An error occurred. Please try again.")
        return
      }
      if (!res.ok) {
        const json = (await res.json().catch(() => null)) as { error?: unknown } | null
        const message =
          typeof json?.error === "string" && json.error.trim() ? json.error.trim() : "Failed to reset password"
        setError(message)
        return
      }

      setIsComplete(true)
      setTimeout(() => router.push("/sign-in"), 1800)
    } catch {
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (isComplete) {
    return (
      <main className="min-h-screen bg-background">
        <Header />
        <div className="min-h-screen flex items-center justify-center px-4 pt-16">
          <div className="w-full max-w-md">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 via-primary/20 to-primary/30 rounded-2xl blur-xl opacity-70 animate-pulse" />
              <div className="relative bg-card border border-border rounded-2xl p-8 shadow-2xl text-center">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-5">
                  <Check className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-2">Password reset successful</h1>
                <p className="text-muted-foreground">You can now sign in with your new password.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    )
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
                <h1 className="text-2xl font-bold text-foreground mb-2">Create a new password</h1>
                <p className="text-muted-foreground">
                  Resetting password for
                  <br />
                  <span className="text-foreground font-medium">{email || "your account"}</span>
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground">
                    New password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a new password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="bg-secondary border-border focus:ring-primary pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-foreground">
                    Confirm new password
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="bg-secondary border-border focus:ring-primary pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Your password must contain:</p>
                  <ul className="space-y-1 text-sm">
                    <li className={cn("flex items-center gap-2", passwordRules.length ? "text-primary" : "text-muted-foreground")}>
                      <Check className={cn("w-4 h-4", passwordRules.length ? "opacity-100" : "opacity-30")} />
                      Between 8 and 64 characters
                    </li>
                    <li className={cn("flex items-center gap-2", passwordRules.letter ? "text-primary" : "text-muted-foreground")}>
                      <Check className={cn("w-4 h-4", passwordRules.letter ? "opacity-100" : "opacity-30")} />
                      At least 1 letter
                    </li>
                    <li className={cn("flex items-center gap-2", passwordRules.number ? "text-primary" : "text-muted-foreground")}>
                      <Check className={cn("w-4 h-4", passwordRules.number ? "opacity-100" : "opacity-30")} />
                      At least 1 number
                    </li>
                  </ul>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || !isPasswordValid || !passwordsMatch}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold h-11"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    "Reset password"
                  )}
                </Button>
              </form>

              <p className="text-center text-muted-foreground mt-8">
                <Link href="/forgot-password" className="text-primary font-medium hover:underline">
                  Start over
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export default function ForgotPasswordResetPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-background" />}>
      <ForgotPasswordResetContent />
    </Suspense>
  )
}
