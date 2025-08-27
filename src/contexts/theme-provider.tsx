
"use client"

import { createContext, useContext, useEffect, useState } from "react"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
  saturation: number
  setSaturation: (saturation: number) => void
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
  saturation: 100,
  setSaturation: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const [saturation, setSaturation] = useState<number>(100);


  useEffect(() => {
    const storedTheme = (localStorage.getItem(storageKey) as Theme) || defaultTheme;
    setTheme(storedTheme);
    const storedSaturation = localStorage.getItem(`${storageKey}-saturation`);
    if (storedSaturation) {
        setSaturation(JSON.parse(storedSaturation));
    }
  }, [storageKey, defaultTheme]);

  useEffect(() => {
    const root = window.document.documentElement

    root.classList.remove("light", "dark")

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light"

      root.classList.add(systemTheme)
    } else {
        root.classList.add(theme)
    }

    root.style.setProperty('--saturation', `${saturation}%`);

  }, [theme, saturation])

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme)
      setTheme(theme)
    },
    saturation,
    setSaturation: (newSaturation: number) => {
      localStorage.setItem(`${storageKey}-saturation`, JSON.stringify(newSaturation));
      setSaturation(newSaturation);
    }
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
