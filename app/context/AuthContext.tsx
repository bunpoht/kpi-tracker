"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import type { User } from "@/types"

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    try {
      console.log("[v0] Checking authentication...")
      const response = await fetch("/api/auth/me", {
        credentials: "include",
      })
      console.log("[v0] Auth check response:", response.status)

      if (response.ok) {
        const data = await response.json()
        console.log("[v0] User authenticated:", data.user.email)
        setUser(data.user)
      } else {
        console.log("[v0] Not authenticated")
        setUser(null)
      }
    } catch (error) {
      console.error("[v0] Auth check failed:", error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  async function login(email: string, password: string) {
    console.log("[v0] Attempting login for:", email)
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      credentials: "include",
    })

    if (!response.ok) {
      const error = await response.json()
      console.error("[v0] Login failed:", error.message)
      throw new Error(error.message || "Login failed")
    }

    const data = await response.json()
    console.log("[v0] Login successful:", data.user.email)
    setUser(data.user)
    console.log("[v0] User set, redirecting to dashboard...")
    router.push("/dashboard")
  }

  async function register(email: string, password: string, name: string) {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
      credentials: "include",
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || "Registration failed")
    }

    const data = await response.json()
    if (data.user.status === "PENDING") {
      router.push("/register/success")
    } else {
      setUser(data.user)
      router.push("/dashboard")
    }
  }

  async function logout() {
    console.log("[v0] Logging out...")
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    })
    setUser(null)
    router.push("/")
  }

  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
