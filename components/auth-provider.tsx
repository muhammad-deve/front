"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import type { User } from "@/lib/types"

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  signIn: (email: string, password: string) => Promise<boolean>
  signUp: (data: SignUpData) => Promise<boolean>
  signOut: () => void
  addToWatchlist: (contentId: string) => void
  removeFromWatchlist: (contentId: string) => void
  isInWatchlist: (contentId: string) => boolean
}

interface SignUpData {
  firstName: string
  lastName: string
  email: string
  password: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  const signIn = useCallback(async (email: string, password: string): Promise<boolean> => {
    // Mock authentication
    if (email && password.length >= 8) {
      setUser({
        id: "1",
        email,
        firstName: "John",
        lastName: "Doe",
        watchlist: [],
        watchHistory: [],
      })
      return true
    }
    return false
  }, [])

  const signUp = useCallback(async (data: SignUpData): Promise<boolean> => {
    // Mock sign up
    if (data.email && data.password.length >= 8) {
      setUser({
        id: "1",
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        watchlist: [],
        watchHistory: [],
      })
      return true
    }
    return false
  }, [])

  const signOut = useCallback(() => {
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
        signIn,
        signUp,
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
