import { createContext, useContext, useEffect, useState } from "react"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
    children: React.ReactNode
    defaultTheme?: Theme
    defaultGlass?: boolean
    storageKey?: string
    glassStorageKey?: string
}

type ThemeProviderState = {
    theme: Theme
    setTheme: (theme: Theme) => void
    isGlass: boolean
    setGlass: (isGlass: boolean) => void
}

const initialState: ThemeProviderState = {
    theme: "system",
    setTheme: () => null,
    isGlass: false,
    setGlass: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
                                  children,
                                  defaultTheme = "system",
                                  defaultGlass = false,
                                  storageKey = "vite-ui-theme",
                                  glassStorageKey = "vite-ui-glass",
                              }: ThemeProviderProps) {
    const [theme, setTheme] = useState<Theme>(
        () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
    )

    const [isGlass, setGlass] = useState<boolean>(
        () => {
            const stored = localStorage.getItem(glassStorageKey);
            return stored ? stored === "true" : defaultGlass;
        }
    )

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
    }, [theme])

    useEffect(() => {
        const root = window.document.documentElement
        if (isGlass) {
            root.classList.add("glass")
        } else {
            root.classList.remove("glass")
        }
    }, [isGlass])

    const value = {
        theme,
        setTheme: (theme: Theme) => {
            localStorage.setItem(storageKey, theme)
            setTheme(theme)
        },
        isGlass,
        setGlass: (glass: boolean) => {
            localStorage.setItem(glassStorageKey, String(glass))
            setGlass(glass)
        }
    }

    return (
        <ThemeProviderContext.Provider value={value}>
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