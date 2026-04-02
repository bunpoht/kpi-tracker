"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react"

type Theme = "light" | "violet" | "midnight"

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children, forcedTheme }: { children: React.ReactNode; forcedTheme?: Theme }) {
  const [theme, setThemeState] = useState<Theme>(forcedTheme || "light")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (forcedTheme) {
      setThemeState(forcedTheme)
      document.documentElement.setAttribute("data-theme", forcedTheme)
      // Optionally update localStorage so if forcedTheme is removed, they stay on the last forced theme?
      // Or just leave localStorage alone so their old preference returns?
      // Let's update localStorage to keep it consistent.
      localStorage.setItem("theme", forcedTheme)
    } else {
      const savedTheme = (localStorage.getItem("theme") as Theme) || "light"
      setThemeState(savedTheme)
      document.documentElement.setAttribute("data-theme", savedTheme)
    }
  }, [forcedTheme])

  const setTheme = useCallback((newTheme: Theme) => {
    if (forcedTheme) return // Cannot change if forced
    setThemeState(newTheme)
    localStorage.setItem("theme", newTheme)
    document.documentElement.setAttribute("data-theme", newTheme)
  }, [forcedTheme])

  const toggleTheme = useCallback(() => {
    if (forcedTheme) return // Cannot toggle if forced
    const newTheme = theme === "light" ? "violet" : theme === "violet" ? "midnight" : "light"
    setTheme(newTheme)
  }, [forcedTheme, theme, setTheme])

  const value = useMemo(() => ({
    theme,
    toggleTheme,
    setTheme
  }), [theme, toggleTheme, setTheme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)

  if (context === undefined) {
    return {
      theme: "light" as Theme,
      toggleTheme: () => { },
      setTheme: () => { },
    }
  }

  return context
}
