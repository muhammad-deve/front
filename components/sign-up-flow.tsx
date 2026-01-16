"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "./auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { Play, Loader2, Check, ArrowLeft, PartyPopper, Eye, EyeOff } from "lucide-react"
import { cn } from "@/lib/utils"

type Step = 1 | 2 | 3

interface FormData {
  firstName: string
  lastName: string
  email: string
  agreeToTerms: boolean
  password: string
  confirmPassword: string
  verificationCode: string
}

const initialFormData: FormData = {
  firstName: "",
  lastName: "",
  email: "",
  agreeToTerms: false,
  password: "",
  confirmPassword: "",
  verificationCode: "",
}

export function SignUpFlow() {
  const router = useRouter()
  const { requestOtp, verifyOtp } = useAuth()
  const [step, setStep] = useState<Step>(1)
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [resendCountdown, setResendCountdown] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const passwordRules = {
    length: formData.password.length >= 8 && formData.password.length <= 64,
    letter: /[A-Za-z]/.test(formData.password),
    number: /\d/.test(formData.password),
  }
  const isPasswordValid = passwordRules.length && passwordRules.letter && passwordRules.number
  const passwordsMatch = formData.password === formData.confirmPassword && formData.confirmPassword !== ""

  // Countdown timer for resend
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCountdown])

  const updateFormData = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError("")
  }

  const requestSignupOtp = async (email: string): Promise<boolean> => {
    const res = await fetch("/api/auth/request-otp", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, purpose: "signup" }),
    }).catch(() => null)
    if (!res) {
      setError("An error occurred. Please try again.")
      return false
    }
    if (res.ok) return true
    const json = (await res.json().catch(() => null)) as { error?: unknown } | null
    const msg = typeof json?.error === "string" && json.error.trim() ? json.error.trim() : "Failed to send code"
    setError(msg)
    return false
  }

  const checkEmailExists = async (email: string): Promise<boolean | null> => {
    const res = await fetch("/api/auth/check-email", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email }),
    }).catch(() => null)
    if (!res) return null
    if (!res.ok) return null
    const json = (await res.json().catch(() => null)) as { exists?: unknown } | null
    return typeof json?.exists === "boolean" ? json.exists : null
  }

  const handleResendCode = async () => {
    setIsLoading(true)
    setError("")
    try {
      const ok = await requestSignupOtp(formData.email)
      if (!ok) {
        return
      }
      setResendCountdown(60)
    } catch {
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.firstName || !formData.lastName || !formData.email) {
      setError("Please fill in all fields")
      return
    }
    if (!formData.agreeToTerms) {
      setError("You must agree to the Terms & Conditions")
      return
    }

    setIsLoading(true)
    setError("")
    try {
      const exists = await checkEmailExists(formData.email)
      if (exists === true) {
        setError("Email already registered")
        return
      }
      if (exists === null) {
        setError("Unable to validate email. Please try again.")
        return
      }

      setStep(2)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isPasswordValid) {
      setError("Your password doesn't meet the requirements")
      return
    }
    if (!passwordsMatch) {
      setError("Passwords do not match")
      return
    }
    setIsLoading(true)
    setError("")
    try {
      const ok = await requestSignupOtp(formData.email)
      if (!ok) {
        return
      }
      setResendCountdown(60)
      setStep(3)
    } catch {
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleStep3Submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!/^\d{5}$/.test(formData.verificationCode)) {
      setError("Please enter the 5-digit verification code")
      return
    }
    setIsLoading(true)

    try {
      const success = await verifyOtp({
        email: formData.email,
        purpose: "signup",
        otp: formData.verificationCode,
        firstName: formData.firstName,
        lastName: formData.lastName,
        password: formData.password,
      })

      if (success) {
        setIsComplete(true)
        setTimeout(() => router.push("/"), 2000)
      } else {
        setError("Invalid or expired code")
      }
    } catch {
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const goBack = () => {
    if (step > 1) {
      setStep((step - 1) as Step)
      setError("")
    }
  }

  // Success animation
  if (isComplete) {
    return (
      <div className="w-full max-w-md">
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 via-primary/20 to-primary/30 rounded-2xl blur-xl opacity-70 animate-pulse" />
          <div className="relative bg-card border border-border rounded-2xl p-8 shadow-2xl text-center">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6 animate-bounce">
              <PartyPopper className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Welcome to StreamVault!</h1>
            <p className="text-muted-foreground">Your account has been created successfully.</p>
            <p className="text-sm text-muted-foreground mt-4">Redirecting you to the homepage...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md">
      {/* Card with glow effect */}
      <div className="relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 rounded-2xl blur-xl opacity-50" />
        <div className="relative bg-card border border-border rounded-2xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <Play className="w-6 h-6 text-primary-foreground fill-primary-foreground" />
              </div>
              <span className="text-2xl font-bold text-foreground">StreamVault</span>
            </Link>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all",
                    s < step
                      ? "bg-primary text-primary-foreground"
                      : s === step
                        ? "bg-primary text-primary-foreground ring-4 ring-primary/30"
                        : "bg-muted text-muted-foreground",
                  )}
                >
                  {s < step ? <Check className="w-4 h-4" /> : s}
                </div>
                {s < 3 && <div className={cn("w-12 h-1 mx-1 rounded-full", s < step ? "bg-primary" : "bg-muted")} />}
              </div>
            ))}
          </div>

          {/* Step 1: Account Details */}
          {step === 1 && (
            <form onSubmit={handleStep1Submit} className="space-y-5">
              <div className="text-center mb-6">
                <h1 className="text-xl font-bold text-foreground mb-1">Create your account</h1>
                <p className="text-sm text-muted-foreground">Step 1 of 3 - Account Details</p>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-foreground">
                    First Name
                  </Label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={(e) => updateFormData("firstName", e.target.value)}
                    required
                    className="bg-secondary border-border focus:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-foreground">
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={(e) => updateFormData("lastName", e.target.value)}
                    required
                    className="bg-secondary border-border focus:ring-primary"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => updateFormData("email", e.target.value)}
                  required
                  className="bg-secondary border-border focus:ring-primary"
                />
              </div>

              <div className="flex items-start gap-2">
                <Checkbox
                  id="terms"
                  checked={formData.agreeToTerms}
                  onCheckedChange={(checked) => updateFormData("agreeToTerms", checked as boolean)}
                  className="mt-1 border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <Label
                  htmlFor="terms"
                  className="text-sm text-muted-foreground cursor-pointer leading-relaxed flex flex-wrap items-center gap-x-1"
                >
                  <span>I agree to the</span>
                  <Link href="/terms" className="text-primary hover:underline font-medium">
                    Terms & Conditions
                  </Link>
                  <span>and</span>
                  <Link href="/privacy" className="text-primary hover:underline font-medium">
                    Privacy Policy
                  </Link>
                </Label>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-11 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Continue...
                  </>
                ) : (
                  "Continue"
                )}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/sign-in" className="text-primary font-medium hover:underline">
                  Sign in
                </Link>
              </p>
            </form>
          )}

          {/* Step 2: Password */}
          {step === 2 && (
            <form onSubmit={handleStep2Submit} className="space-y-5">
              <div className="flex items-center gap-3 mb-6">
                <button
                  type="button"
                  onClick={goBack}
                  className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-xl font-bold text-foreground">Create a password</h1>
                  <p className="text-sm text-muted-foreground">Step 2 of 3 - Security</p>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={(e) => updateFormData("password", e.target.value)}
                    required
                    className="bg-secondary border-border focus:ring-primary pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-foreground">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => updateFormData("confirmPassword", e.target.value)}
                    required
                    className="bg-secondary border-border focus:ring-primary pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-11 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Continue...
                  </>
                ) : (
                  "Continue"
                )}
              </Button>
            </form>
          )}

          {/* Step 3: Email Verification */}
          {step === 3 && (
            <form onSubmit={handleStep3Submit} className="space-y-5">
              <div className="flex items-center gap-3 mb-6">
                <button
                  type="button"
                  onClick={goBack}
                  className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-xl font-bold text-foreground">Verify your email</h1>
                  <p className="text-sm text-muted-foreground">Step 3 of 3 - Verification</p>
                </div>
              </div>

              <p className="text-center text-muted-foreground">
                We&apos;ve sent a verification code to
                <br />
                <span className="text-foreground font-medium">{formData.email}</span>
              </p>

              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                  {error}
                </div>
              )}

              <div className="flex justify-center">
                <InputOTP
                  maxLength={5}
                  value={formData.verificationCode}
                  onChange={(v) => updateFormData("verificationCode", v)}
                >
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
                  <button
                    type="button"
                    onClick={handleResendCode}
                    className="text-sm text-primary hover:underline font-medium"
                  >
                    Resend code
                  </button>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading || !/^\d{5}$/.test(formData.verificationCode)}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-11 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify email"
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
