import React, { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "../../components/ui/index";
import { InputField, PasswordInputField } from "../../components/ui/forms/index";
import { notify } from "../../util/notify";
import AuthService from "../../services/AuthService";
import { PATHS } from "../../routes/path";

const ResetPassword: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [errors, setErrors] = useState<{ email?: string; password?: string; password_confirmation?: string }>({});
    const [isLoading, setIsLoading] = useState(false);

    const validate = (): boolean => {
        const newErrors: { email?: string; password?: string; password_confirmation?: string } = {};

        if (!email.trim()) {
            newErrors.email = "Email is required.";
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = "Please enter a valid email.";
        }

        if (!password.trim()) {
            newErrors.password = "Password is required.";
        }

        if (!confirmPassword.trim()) {
            newErrors.password_confirmation = "Please confirm your password.";
        } else if (password !== confirmPassword) {
            newErrors.password_confirmation = "Passwords do not match.";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate() || !token) return;

        setIsLoading(true);
        try {
            const response = await AuthService.resetPassword({
                email,
                token,
                password,
                password_confirmation: confirmPassword,
            });
            notify.success(response.data?.message || "Your password has been reset successfully.");
            navigate(PATHS.LOGIN, { replace: true });
        } catch (err) {
            const axiosErr = err as any;
            const status = axiosErr.response?.status;
            const data = axiosErr.response?.data;

            if (status === 422 && data?.errors) {
                setErrors({
                    email: data.errors.email?.[0],
                    password: data.errors.password?.[0],
                    password_confirmation: data.errors.password_confirmation?.[0],
                });
            } else if (data?.message) {
                notify.error(data.message);
            } else {
                notify.error("Unable to reset your password. Please try again.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <div className="min-h-screen w-full flex items-center justify-center bg-bg-dark px-6 py-12">
                <div className="w-full max-w-lg bg-bg-main border border-border-muted rounded-3xl p-10 shadow-xl">
                    <div className="space-y-4 mb-8 text-center">
                        <h1 className="text-3xl font-black uppercase tracking-tighter text-text">Reset Password</h1>
                        <p className="text-sm text-text-muted">
                            Set a new secure password for your account and sign in again.
                        </p>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-6" id="reset-password-form">
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
                            label="New Password"
                            name="password"
                            placeholder="Enter a new password"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                            }}
                            error={errors.password}
                            fullWidth
                            required
                            autoComplete="new-password"
                        />
                        <PasswordInputField
                            label="Confirm Password"
                            name="password_confirmation"
                            placeholder="Repeat your new password"
                            value={confirmPassword}
                            onChange={(e) => {
                                setConfirmPassword(e.target.value);
                                if (errors.password_confirmation) setErrors((prev) => ({ ...prev, password_confirmation: undefined }));
                            }}
                            error={errors.password_confirmation}
                            fullWidth
                            required
                            autoComplete="new-password"
                        />
                        <Button
                            type="submit"
                            variant="primary"
                            fullWidth
                            isLoading={isLoading}
                            loadingText="Resetting..."
                            iconName="FaUnlockKeyhole"
                            size="lg"
                            id="reset-password-submit"
                        >
                            Reset Password
                        </Button>
                    </form>
                    <div className="mt-6 text-center text-sm text-text-muted">
                        <p>
                            Already have your password?{' '}
                            <Link to={PATHS.LOGIN} className="text-primary font-semibold hover:text-primary/80">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>

        </>
    );
};

export default ResetPassword;

