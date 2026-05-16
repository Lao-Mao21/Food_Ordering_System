import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, ToastProvider } from "../../components/ui/index";
import { InputField, PasswordInputField } from "../../components/ui/forms/index";
import { useAuth } from "../../contexts/AuthContext";
import { notify } from "../../util/notify";
import { PATHS } from "../../routes/path";
import BrandLogo from "../../assets/vite.svg";
import type { AxiosError } from "axios";

const Login: React.FC = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
    const [isLoading, setIsLoading] = useState(false);

    const validate = (): boolean => {
        const newErrors: { email?: string; password?: string } = {};

        if (!email.trim()) {
            newErrors.email = "Email is required.";
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = "Please enter a valid email.";
        }

        if (!password.trim()) {
            newErrors.password = "Password is required.";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setIsLoading(true);
        try {
            await login({ email, password });
            notify.success("Login successful!");
            navigate(PATHS.APP.DASHBOARD, { replace: true });
        } catch (err) {
            const axiosErr = err as AxiosError<{ message?: string; errors?: Record<string, string[]> }>;
            const status = axiosErr.response?.status;
            const data = axiosErr.response?.data;

            if (status === 422 && data?.errors) {
                // Validation errors — map to form fields
                setErrors({
                    email: data.errors.email?.[0],
                    password: data.errors.password?.[0],
                });
            } else if (status === 401) {
                notify.error(data?.message || "Invalid credentials. Please try again.");
            } else {
                notify.error("Something went wrong. Please try again.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <div className="min-h-screen w-full flex flex-col lg:flex-row bg-bg-dark">

                {/* ─── LEFT COLUMN — BRANDING ─── */}
                <div className="relative w-full lg:w-1/2 flex flex-col items-center justify-center px-8 py-12 lg:py-0 overflow-hidden">

                    {/* Animated gradient background */}
                    <div className="absolute inset-0 bg-linear-to-br from-primary/20 via-bg-dark to-secondary/10" />

                    {/* Floating orbs */}
                    <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary/15 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-1/4 right-1/4 w-56 h-56 bg-secondary/15 rounded-full blur-3xl animate-pulse [animation-delay:1s]" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse [animation-delay:2s]" />

                    {/* Content */}
                    <div className="relative z-10 flex flex-col items-center text-center gap-6 max-w-md">

                        {/* Logo with glow */}
                        <div className="relative group">
                            <div className="absolute inset-0 bg-primary/30 rounded-3xl blur-2xl group-hover:bg-primary/40 transition-all duration-700 scale-110" />
                            <div className="relative bg-bg-light/10 backdrop-blur-xl border border-border-muted/40 rounded-3xl p-8 shadow-lg
                hover:scale-105 hover:border-primary/40 transition-all duration-500">
                                <img
                                    src={BrandLogo}
                                    alt="Sample Logo"
                                    className="w-24 h-24 lg:w-32 lg:h-32 drop-shadow-lg"
                                />
                            </div>
                        </div>

                        {/* Brand name */}
                        <div className="space-y-3">
                            <h1 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter text-text">
                                BUENAVIDES
                            </h1>
                            <p className="text-sm lg:text-base font-semibold uppercase tracking-[0.3em] text-text-muted">
                                React × Laravel
                            </p>
                        </div>

                        {/* Tagline */}
                        <p className="text-text-muted text-sm lg:text-base leading-relaxed max-w-xs">
                            A modern full-stack development boilerplate built for speed, scalability, and elegance.
                        </p>

                        {/* Decorative dots */}
                        <div className="flex items-center gap-2 mt-4">
                            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                            <span className="w-8 h-1 rounded-full bg-primary/40" />
                            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse [animation-delay:0.5s]" />
                            <span className="w-8 h-1 rounded-full bg-secondary/40" />
                            <span className="w-2 h-2 rounded-full bg-primary animate-pulse [animation-delay:1s]" />
                        </div>
                    </div>
                </div>

                {/* ─── RIGHT COLUMN — LOGIN FORM ─── */}
                <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 lg:py-0">
                    <div className="w-full max-w-md">

                        {/* Card container */}
                        <div className="bg-bg-main border border-border-muted rounded-3xl p-8 lg:p-10 shadow-lg space-y-8
              hover:shadow-xl transition-shadow duration-500">

                            {/* Header */}
                            <div className="space-y-2">
                                <h2 className="text-2xl lg:text-3xl font-black uppercase tracking-tighter text-text">
                                    Welcome Back
                                </h2>
                                <p className="text-sm text-text-muted font-medium">
                                    Sign in to your account to continue.
                                </p>
                            </div>

                            {/* Divider with icon */}
                            <div className="flex items-center gap-4">
                                <div className="flex-1 h-px bg-border-muted" />
                                <span className="w-2 h-2 rounded-full bg-primary/60" />
                                <div className="flex-1 h-px bg-border-muted" />
                            </div>

                            {/* Login form */}
                            <form onSubmit={handleSubmit} className="space-y-5" id="login-form">

                                <InputField
                                    label="Email"
                                    name="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    iconName="FaEnvelope"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                                    }}
                                    error={errors.email}
                                    fullWidth
                                    required
                                    autoComplete="email"
                                />

                                <PasswordInputField
                                    label="Password"
                                    name="password"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                                    }}
                                    error={errors.password}
                                    fullWidth
                                    required
                                    autoComplete="current-password"
                                />

                                {/* Forgot password link */}
                                <div className="flex justify-end">
                                    <Link
                                        to="#"
                                        className="text-xs font-semibold uppercase tracking-wider text-primary hover:text-primary/80
                      transition-colors duration-200"
                                        id="forgot-password-link"
                                    >
                                        Forgot Password?
                                    </Link>
                                </div>

                                {/* Submit button */}
                                <Button
                                    type="submit"
                                    variant="primary"
                                    fullWidth
                                    isLoading={isLoading}
                                    loadingText="Signing In..."
                                    iconName="FaRightToBracket"
                                    size="lg"
                                    id="login-submit-btn"
                                >
                                    Sign In
                                </Button>
                            </form>

                            {/* Divider */}
                            <div className="flex items-center gap-4">
                                <div className="flex-1 h-px bg-border-muted" />
                                <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                                    or
                                </span>
                                <div className="flex-1 h-px bg-border-muted" />
                            </div>

                            {/* Register prompt */}
                            <p className="text-center text-sm text-text-muted">
                                Don't have an account?{" "}
                                <Link
                                    to="#"
                                    className="font-bold uppercase tracking-wider text-primary hover:text-primary/80
                    transition-colors duration-200"
                                    id="register-link"
                                >
                                    Sign Up
                                </Link>
                            </p>
                        </div>

                        {/* Footer */}
                        <p className="text-center text-xs text-text-muted/60 mt-6 font-medium tracking-wide">
                            © {new Date().getFullYear()} BUENAVIDES. All rights reserved.
                        </p>
                    </div>
                </div>

            </div>

            <ToastProvider />
        </>
    );
};

export default Login;
