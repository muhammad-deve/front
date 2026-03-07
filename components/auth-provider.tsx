"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
import type { User } from "@/lib/types"

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  signIn: (email: string, password: string) => Promise<boolean>
  requestOtp: (email: string, purpose: "signin" | "signup" | "reset") => Promise<boolean>
  verifyOtp: (data: VerifyOtpData) => Promise<boolean>
  refreshUser: () => Promise<void>
  signOut: () => Promise<void>
  addToWatchlist: (contentId: string) => Promise<void>
  removeFromWatchlist: (contentId: string) => Promise<void>
  isInWatchlist: (contentId: string) => boolean
}

interface VerifyOtpData {
  email: string
  purpose: "signin" | "signup" | "reset"
  otp: string
  firstName?: string
  lastName?: string
  password?: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

	const refreshUser = useCallback(async () => {
		const data = (await fetch("/api/auth/me", { cache: "no-store" })
			.then((r) => (r.ok ? r.json() : null))
			.catch(() => null)) as { user?: unknown } | null
		const u = data?.user
		if (u && typeof u === "object") {
			setUser(u as User)
		} else {
			setUser(null)
		}
	}, [])

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

  const signIn = useCallback(async (email: string, password: string): Promise<boolean> => {
    const res = await fetch("/api/auth/sign-in", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
    if (!res.ok) return false
    const json = (await res.json().catch(() => null)) as { user?: User } | null
    if (json?.user) {
      setUser(json.user)
      return true
    }
    return false
  }, [])

  const requestOtp = useCallback(async (email: string, purpose: "signin" | "signup" | "reset"): Promise<boolean> => {
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

  const addToWatchlist = useCallback(async (contentId: string) => {
    setUser((prev) => {
      if (!prev) return prev
      if (prev.watchlist.includes(contentId)) return prev
      return { ...prev, watchlist: [...prev.watchlist, contentId] }
    })

    const res = await fetch("/api/wishlist/add", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ imdbId: contentId }),
    }).catch(() => null)

    const json = (res && (await res.json().catch(() => null))) as { watchlist?: unknown } | null
    if (json?.watchlist && Array.isArray(json.watchlist)) {
      setUser((prev) => (prev ? { ...prev, watchlist: json.watchlist as string[] } : prev))
    }
  }, [])

  const removeFromWatchlist = useCallback(async (contentId: string) => {
    setUser((prev) => {
      if (!prev) return prev
      return { ...prev, watchlist: prev.watchlist.filter((id) => id !== contentId) }
    })

    const res = await fetch("/api/wishlist/remove", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ imdbId: contentId }),
    }).catch(() => null)

    const json = (res && (await res.json().catch(() => null))) as { watchlist?: unknown } | null
    if (json?.watchlist && Array.isArray(json.watchlist)) {
      setUser((prev) => (prev ? { ...prev, watchlist: json.watchlist as string[] } : prev))
    }
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
        signIn,
        requestOtp,
        verifyOtp,
			refreshUser,
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
