import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export type Theme = "light" | "dark" | "system";

interface ThemeContextType {
    theme: Theme;
    resolvedTheme: Theme;
    isDark: boolean;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
}

const STORAGE_KEY = "app-theme";
const CYCLE_ORDER: Theme[] = ["light", "dark", "system"];

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const getStoredTheme = (): Theme => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") return stored;
    return "system";
};


const resolveTheme = (theme: Theme): Theme => {
    if (theme === "light" || theme === "dark") return theme;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setThemeState] = useState<Theme>(getStoredTheme);
    const [resolvedTheme, setResolvedTheme] = useState<Theme>(() => resolveTheme(theme));

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, theme);
        setResolvedTheme(resolveTheme(theme));
    }, [theme]);

    useEffect(() => {
        if (theme !== "system") return;

        const mql = window.matchMedia("(prefers-color-scheme: dark)");
        const handler = (e: MediaQueryListEvent) => {
            setResolvedTheme(e.matches ? "dark" : "light");
        };

        mql.addEventListener("change", handler);
        return () => mql.removeEventListener("change", handler);
    }, [theme]);

    useEffect(() => {
        const root = document.documentElement;
        if (resolvedTheme === "dark") {
            root.classList.add("dark");
        } else {
            root.classList.remove("dark");
        }
    }, [resolvedTheme]);

    const toggleTheme = useCallback(() => {
        setThemeState((prev) => {
            const idx = CYCLE_ORDER.indexOf(prev);
            return CYCLE_ORDER[(idx + 1) % CYCLE_ORDER.length];
        });
    }, []);

    const setTheme = useCallback((newTheme: Theme) => {
        setThemeState(newTheme);
    }, []);

    return (
        <ThemeContext.Provider
            value={{
                theme,
                resolvedTheme,
                isDark: resolvedTheme === "dark",
                toggleTheme,
                setTheme,
            }}
        >
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = (): ThemeContextType => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error("useTheme must be used within a <ThemeProvider>");
    }
    return context;
};
