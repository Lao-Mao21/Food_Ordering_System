import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/index";
import { InputField, PasswordInputField } from "../../components/ui/forms/index";
import AuthService from "../../services/AuthService";
import { notify } from "../../util/notify";
import { PATHS } from "../../routes/path";
import type { AxiosError } from "axios";

const Register: React.FC = () => {
    const navigate = useNavigate();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirmation, setPasswordConfirmation] = useState("");
    const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; password_confirmation?: string }>({});
    const [isLoading, setIsLoading] = useState(false);

    const validate = (): boolean => {
        const newErrors: { name?: string; email?: string; password?: string; password_confirmation?: string } = {};

        if (!name.trim()) {
            newErrors.name = "Name is required.";
        }
        if (!email.trim()) {
            newErrors.email = "Email is required.";
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = "Please enter a valid email.";
        }
        if (!password.trim()) {
            newErrors.password = "Password is required.";
        } else if (password.length < 8) {
            newErrors.password = "Password must be at least 8 characters.";
        }
        if (!passwordConfirmation.trim()) {
            newErrors.password_confirmation = "Confirm your password.";
        } else if (password !== passwordConfirmation) {
            newErrors.password_confirmation = "Passwords do not match.";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setIsLoading(true);
        try {
            await AuthService.csrf();
            await AuthService.register({
                name,
                email,
                password,
                password_confirmation: passwordConfirmation,
            });
            try {
                await AuthService.logout();
            } catch {
                // Registration creates a session; ignore logout failures and send the user to sign in.
            }
            notify.success("Registration successful. Please sign in after admin access is granted.");
            navigate(PATHS.LOGIN, { replace: true });
        } catch (err) {
            const axiosErr = err as AxiosError<{ message?: string; errors?: Record<string, string[]> }>;
            const status = axiosErr.response?.status;
            const data = axiosErr.response?.data;

            if (status === 422 && data?.errors) {
                setErrors({
                    name: data.errors.name?.[0],
                    email: data.errors.email?.[0],
                    password: data.errors.password?.[0],
                    password_confirmation: data.errors.password_confirmation?.[0],
                });
            } else if (data?.message) {
                notify.error(data.message);
            } else {
                notify.error("Unable to register. Please try again.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <div className="min-h-screen w-full flex flex-col lg:flex-row bg-bg-dark">
                <div className="relative w-full lg:w-1/2 flex flex-col items-center justify-center px-8 py-12 lg:py-0 overflow-hidden">
                    <div className="absolute inset-0 bg-linear-to-br from-primary/20 via-bg-dark to-secondary/10" />
                    <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary/15 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-1/4 right-1/4 w-56 h-56 bg-secondary/15 rounded-full blur-3xl animate-pulse [animation-delay:1s]" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse [animation-delay:2s]" />

                    <div className="relative z-10 flex flex-col items-center text-center gap-6 max-w-md">
                        <div className="space-y-3">
                            <h1 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter text-text">
                                Food Ordering
                            </h1>
                            <p className="text-sm lg:text-base font-semibold uppercase tracking-[0.3em] text-text-muted">
                                Secure login and registration for your food ordering system.
                            </p>
                        </div>

                        <p className="text-text-muted text-sm lg:text-base leading-relaxed max-w-xs">
                            Create an account to manage menu items, orders, and sales analytics from one admin workspace.
                        </p>

                        <div className="grid gap-4 text-left">
                            <div className="rounded-3xl bg-bg-light p-4 shadow-inner border border-border-muted text-text">
                                <p className="font-semibold">What you get</p>
                                <ul className="mt-3 space-y-2 text-sm text-text-muted list-disc list-inside">
                                    <li>Food ordering dashboard access</li>
                                    <li>Live order tracking</li>
                                    <li>Menu and analytics management</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 lg:py-0">
                    <div className="w-full max-w-md">
                        <div className="bg-bg-main border border-border-muted rounded-3xl p-8 lg:p-10 shadow-lg space-y-8 hover:shadow-xl transition-shadow duration-500">
                            <div className="space-y-2">
                                <h2 className="text-2xl lg:text-3xl font-black uppercase tracking-tighter text-text">
                                    Create your account
                                </h2>
                                <p className="text-sm text-text-muted font-medium">
                                    Register now and start managing your food ordering system from one place.
                                </p>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="flex-1 h-px bg-border-muted" />
                                <span className="w-2 h-2 rounded-full bg-primary/60" />
                                <div className="flex-1 h-px bg-border-muted" />
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <InputField
                                    label="Full Name"
                                    name="name"
                                    placeholder="John Doe"
                                    value={name}
                                    onChange={(e) => {
                                        setName(e.target.value);
                                        if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                                    }}
                                    error={errors.name}
                                    fullWidth
                                    required
                                />

                                <InputField
                                    label="Email"
                                    name="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                                    }}
                                    error={errors.email}
                                    fullWidth
                                    required
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
                                />

                                <PasswordInputField
                                    label="Confirm Password"
                                    name="password_confirmation"
                                    placeholder="Repeat your password"
                                    value={passwordConfirmation}
                                    onChange={(e) => {
                                        setPasswordConfirmation(e.target.value);
                                        if (errors.password_confirmation) setErrors((prev) => ({ ...prev, password_confirmation: undefined }));
                                    }}
                                    error={errors.password_confirmation}
                                    fullWidth
                                    required
                                />

                                <Button
                                    type="submit"
                                    variant="primary"
                                    fullWidth
                                    isLoading={isLoading}
                                    loadingText="Creating Account..."
                                    iconName="FaUserPlus"
                                    size="lg"
                                >
                                    Create Account
                                </Button>
                            </form>

                            <div className="flex items-center gap-4">
                                <div className="flex-1 h-px bg-border-muted" />
                                <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                                    already registered?
                                </span>
                                <div className="flex-1 h-px bg-border-muted" />
                            </div>

                            <p className="text-center text-sm text-text-muted">
                                <Link
                                    to={PATHS.LOGIN}
                                    className="font-bold uppercase tracking-wider text-primary hover:text-primary/80 transition-colors duration-200"
                                >
                                    Sign In
                                </Link>
                            </p>
                        </div>

                        <p className="text-center text-xs text-text-muted/60 mt-6 font-medium tracking-wide">
                            © {new Date().getFullYear()} Food Ordering. All rights reserved.
                        </p>
                    </div>
                </div>
            </div>


        </>
    );
};

export default Register;






