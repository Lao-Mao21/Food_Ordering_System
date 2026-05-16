import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { User } from "../interfaces/user";
import AuthService from "../services/AuthService";


interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (credentials: { email: string; password: string }) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}


const AuthContext = createContext<AuthContextType | undefined>(undefined);


export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    /**
     * Fetch current user from /api/user/auth/me
     * Silently fails for 401 (not logged in).
     */
    const refreshUser = useCallback(async () => {
        try {
            const res = await AuthService.me() as any;
            setUser(res?.data?.user ?? null);
        } catch {
            setUser(null);
        }
    }, []);

    /**
     * We need to check if a valid session exists.
     */
    useEffect(() => {
        const bootstrap = async () => {
            setIsLoading(true);
            await refreshUser();
            setIsLoading(false);
        };
        bootstrap();
    }, [refreshUser]);

    /**
     * Login flow: CSRF -> authenticate -> refresh user state.
     */
    const login = async (credentials: { email: string; password: string }) => {
        await AuthService.csrf();
        const res = await AuthService.login(credentials) as any;
        setUser(res?.data?.data?.user ?? null);
    };

    /**
     * Logout flow: call server -> clear local state.
     */
    const logout = async () => {
        await AuthService.logout();
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                isLoading,
                login,
                logout,
                refreshUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an <AuthProvider>");
    }
    return context;
};
