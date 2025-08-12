
"use client"

import { createContext, useContext, useEffect, useState } from "react"

type Theme = "light" | "dark"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: "light",
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "light",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') {
      return defaultTheme;
    }
    try {
      const storedTheme = localStorage.getItem(storageKey);
      if (storedTheme === 'light' || storedTheme === 'dark') {
          return storedTheme;
      }
    } catch (e) {
        console.error("Failed to access localStorage", e);
    }
    return defaultTheme;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const root = window.document.documentElement
    root.classList.remove("theme-light", "theme-grey", "theme-dark")

    // Add a class based on the current theme
    if (theme === "light") {
      root.classList.add("theme-light")
    } else if (theme === "dark") {
      root.classList.add("theme-dark")
    } else {
       root.classList.add(`theme-${theme}`)
    }
    
  }, [theme])

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem(storageKey, theme)
        }
      } catch (e) {
          console.error("Failed to access localStorage", e);
      }
      setTheme(theme)
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)
  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")
  return context
}
