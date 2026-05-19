import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/index";
import { InputField, PasswordInputField } from "../../components/ui/forms/index";
import AuthService from "../../services/AuthService";
import { notify } from "../../util/notify";
import { PATHS } from "../../routes/path";
import BrandLogo from "../../assets/OrderGood.jpg";
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
            await AuthService.logout().catch(() => undefined);
            notify.success("Registration successful. First account becomes admin; later accounts need admin access granted.");
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
        <div className="min-h-screen lg:h-screen w-full flex flex-col lg:flex-row bg-bg-dark lg:overflow-hidden">
            <div className="relative w-full lg:w-5/12 flex flex-col items-center justify-center px-6 py-8 lg:py-0 overflow-hidden">
                <div className="absolute inset-0 bg-linear-to-br from-primary/20 via-bg-dark to-secondary/10" />
                <div className="absolute top-1/4 left-1/4 w-56 h-56 bg-primary/15 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-secondary/15 rounded-full blur-3xl animate-pulse [animation-delay:1s]" />

                <div className="relative z-10 flex flex-col items-center text-center gap-5 max-w-sm">
                    <div className="relative bg-bg-light/10 backdrop-blur-xl border border-border-muted/40 rounded-3xl p-5 shadow-lg">
                        <img
                            src={BrandLogo}
                            alt="OrderGood logo"
                            className="w-20 h-20 lg:w-24 lg:h-24 rounded-lg object-cover drop-shadow-lg"
                        />
                    </div>

                    <div className="space-y-3">
                        <h1 className="text-4xl font-black uppercase tracking-tighter text-text">
                            OrderGood
                        </h1>
                        <p className="text-xs lg:text-sm font-semibold uppercase tracking-[0.24em] text-text-muted">
                            Restaurant order management
                        </p>
                    </div>

                    <p className="text-text-muted text-sm leading-relaxed max-w-xs">
                        Create the first admin account, or sign in if your team already has one.
                    </p>
                </div>
            </div>

            <div className="w-full lg:w-7/12 flex items-center justify-center px-6 py-8 lg:py-0">
                <div className="w-full max-w-2xl">
                    <div className="bg-bg-main border border-border-muted rounded-3xl p-6 lg:p-8 shadow-lg space-y-5 hover:shadow-xl transition-shadow duration-500">
                        <div className="space-y-2">
                            <h2 className="text-2xl lg:text-3xl font-black uppercase tracking-tighter text-text">
                                Create your account
                            </h2>
                            <p className="text-sm text-text-muted font-medium">
                                First account becomes admin. Later accounts need admin access granted.
                            </p>
                        </div>

                        <div className="flex items-center gap-4 py-1">
                            <div className="flex-1 h-px bg-border-muted" />
                            <span className="w-2 h-2 rounded-full bg-primary/60" />
                            <div className="flex-1 h-px bg-border-muted" />
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <InputField
                                    label="Full Name"
                                    name="name"
                                    placeholder="Enter full name"
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
                            </div>

                            <Button
                                type="submit"
                                variant="primary"
                                fullWidth
                                isLoading={isLoading}
                                loadingText="Creating Account..."
                                iconName="FaUserPlus"
                                size="md"
                            >
                                Create Account
                            </Button>
                        </form>

                        <div className="flex items-center gap-4">
                            <div className="flex-1 h-px bg-border-muted" />
                            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">or</span>
                            <div className="flex-1 h-px bg-border-muted" />
                        </div>

                        <p className="text-center text-sm text-text-muted">
                            Already registered?{" "}
                            <Link
                                to={PATHS.LOGIN}
                                className="font-bold uppercase tracking-wider text-primary hover:text-primary/80 transition-colors duration-200"
                            >
                                Sign In
                            </Link>
                        </p>
                    </div>

                    <p className="text-center text-xs text-text-muted/60 mt-4 font-medium tracking-wide">
                        © {new Date().getFullYear()} OrderGood. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
