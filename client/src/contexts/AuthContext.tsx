/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { User } from "../interfaces/user";
import AuthService from "../services/AuthService";


interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (credentials: { email: string; password: string }) => Promise<User | null>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<User | null>;
}


const AuthContext = createContext<AuthContextType | undefined>(undefined);

type CurrentUserResponse = {
    data?: {
        user?: User;
        data?: {
            user?: User;
        };
    };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refreshUser = useCallback(async () => {
        try {
            const res = await AuthService.me() as CurrentUserResponse;
            const nextUser = res?.data?.user ?? null;
            setUser(nextUser);
            return nextUser;
        } catch {
            setUser(null);
            return null;
        }
    }, []);

    useEffect(() => {
        const bootstrap = async () => {
            setIsLoading(true);
            await refreshUser();
            setIsLoading(false);
        };
        bootstrap();
    }, [refreshUser]);

    const login = async (credentials: { email: string; password: string }) => {
        await AuthService.csrf();
        const res = await AuthService.login(credentials) as CurrentUserResponse;
        const nextUser = res?.data?.data?.user ?? null;
        setUser(nextUser);
        return nextUser;
    };

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
