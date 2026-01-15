"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
import type { User } from "@/lib/types"

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  requestOtp: (email: string, purpose: "signin" | "signup") => Promise<boolean>
  verifyOtp: (data: VerifyOtpData) => Promise<boolean>
  signOut: () => Promise<void>
  addToWatchlist: (contentId: string) => void
  removeFromWatchlist: (contentId: string) => void
  isInWatchlist: (contentId: string) => boolean
}

interface VerifyOtpData {
  email: string
  purpose: "signin" | "signup"
  otp: string
  firstName?: string
  lastName?: string
  password?: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return
        const u = (data as { user?: unknown } | null)?.user
        if (u && typeof u === "object") {
          setUser(u as User)
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const requestOtp = useCallback(async (email: string, purpose: "signin" | "signup"): Promise<boolean> => {
    const res = await fetch("/api/auth/request-otp", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, purpose }),
    })
    return res.ok
  }, [])

  const verifyOtp = useCallback(async (data: VerifyOtpData): Promise<boolean> => {
    const res = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) return false
    const json = (await res.json().catch(() => null)) as { user?: User } | null
    if (json?.user) {
      setUser(json.user)
      return true
    }
    return false
  }, [])

  const signOut = useCallback(async () => {
    await fetch("/api/auth/sign-out", { method: "POST" }).catch(() => {})
    setUser(null)
  }, [])

  const addToWatchlist = useCallback((contentId: string) => {
    setUser((prev) => {
      if (!prev) return prev
      if (prev.watchlist.includes(contentId)) return prev
      return { ...prev, watchlist: [...prev.watchlist, contentId] }
    })
  }, [])

  const removeFromWatchlist = useCallback((contentId: string) => {
    setUser((prev) => {
      if (!prev) return prev
      return { ...prev, watchlist: prev.watchlist.filter((id) => id !== contentId) }
    })
  }, [])

  const isInWatchlist = useCallback(
    (contentId: string): boolean => {
      return user?.watchlist.includes(contentId) ?? false
    },
    [user],
  )

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        requestOtp,
        verifyOtp,
        signOut,
        addToWatchlist,
        removeFromWatchlist,
        isInWatchlist,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
