"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "./auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Play, Eye, EyeOff, Loader2, Check, ArrowLeft, PartyPopper } from "lucide-react"
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
  const { signUp } = useAuth()
  const [step, setStep] = useState<Step>(1)
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [resendCountdown, setResendCountdown] = useState(0)
  const [isComplete, setIsComplete] = useState(false)

  // Verification code input refs
  const codeInputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Password validation
  const passwordValidations = {
    minLength: formData.password.length >= 8,
    uppercase: /[A-Z]/.test(formData.password),
    number: /[0-9]/.test(formData.password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password),
  }
  const isPasswordValid = Object.values(passwordValidations).every(Boolean)
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

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value[value.length - 1]
    }
    if (!/^\d*$/.test(value)) return

    const newCode = formData.verificationCode.split("")
    newCode[index] = value
    updateFormData("verificationCode", newCode.join(""))

    // Auto-focus next input
    if (value && index < 5) {
      codeInputRefs.current[index + 1]?.focus()
    }
  }

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !formData.verificationCode[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus()
    }
  }

  const handleResendCode = () => {
    setResendCountdown(60)
    // Mock resend logic
  }

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.firstName || !formData.lastName || !formData.email) {
      setError("Please fill in all fields")
      return
    }
    if (!formData.agreeToTerms) {
      setError("You must agree to the Terms & Conditions")
      return
    }
    setStep(2)
  }

  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isPasswordValid) {
      setError("Please meet all password requirements")
      return
    }
    if (!passwordsMatch) {
      setError("Passwords do not match")
      return
    }
    setResendCountdown(60)
    setStep(3)
  }

  const handleStep3Submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.verificationCode.length !== 6) {
      setError("Please enter the 6-digit verification code")
      return
    }
    setIsLoading(true)

    try {
      // Mock verification - accept any 6-digit code
      const success = await signUp({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
      })

      if (success) {
        setIsComplete(true)
        setTimeout(() => router.push("/"), 2000)
      } else {
        setError("Failed to create account. Please try again.")
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
                <Label htmlFor="terms" className="text-sm text-muted-foreground cursor-pointer leading-relaxed">
                  I agree to the{" "}
                  <Link href="/terms" className="text-primary hover:underline">
                    Terms & Conditions
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>
                </Label>
              </div>

              <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-11">
                Continue
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/sign-in" className="text-primary font-medium hover:underline">
                  Sign in
                </Link>
              </p>
            </form>
          )}

          {/* Step 2: Security */}
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
                  <h1 className="text-xl font-bold text-foreground">Set your password</h1>
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
                    placeholder="Create a strong password"
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

              {/* Password Strength */}
              <div className="space-y-2">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={cn(
                        "h-1 flex-1 rounded-full transition-colors",
                        Object.values(passwordValidations).filter(Boolean).length >= i ? "bg-primary" : "bg-muted",
                      )}
                    />
                  ))}
                </div>
                <ul className="space-y-1 text-xs">
                  {[
                    { key: "minLength", label: "Minimum 8 characters" },
                    { key: "uppercase", label: "At least one uppercase letter" },
                    { key: "number", label: "At least one number" },
                    { key: "special", label: "At least one special character" },
                  ].map(({ key, label }) => (
                    <li
                      key={key}
                      className={cn(
                        "flex items-center gap-2",
                        passwordValidations[key as keyof typeof passwordValidations]
                          ? "text-primary"
                          : "text-muted-foreground",
                      )}
                    >
                      <Check
                        className={cn(
                          "w-3 h-3",
                          passwordValidations[key as keyof typeof passwordValidations] ? "opacity-100" : "opacity-30",
                        )}
                      />
                      {label}
                    </li>
                  ))}
                </ul>
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
                    className={cn(
                      "bg-secondary border-border focus:ring-primary pr-10",
                      formData.confirmPassword &&
                        (passwordsMatch ? "border-primary focus:border-primary" : "border-destructive"),
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {formData.confirmPassword && !passwordsMatch && (
                  <p className="text-xs text-destructive">Passwords do not match</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={!isPasswordValid || !passwordsMatch}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-11 disabled:opacity-50"
              >
                Continue
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

              {/* 6-digit code input */}
              <div className="flex justify-center gap-2">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <Input
                    key={index}
                    ref={(el) => {
                      codeInputRefs.current[index] = el
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={formData.verificationCode[index] || ""}
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    onKeyDown={(e) => handleCodeKeyDown(index, e)}
                    className="w-12 h-14 text-center text-xl font-bold bg-secondary border-border focus:ring-primary focus:border-primary"
                  />
                ))}
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
                disabled={isLoading || formData.verificationCode.length !== 6}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-11 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify & Complete"
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                For demo purposes, enter any 6-digit code to complete registration.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
