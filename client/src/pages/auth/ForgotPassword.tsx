import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/index";
import { InputField } from "../../components/ui/forms/index";
import { notify } from "../../util/notify";
import AuthService from "../../services/AuthService";
import { PATHS } from "../../routes/path";

const ForgotPassword: React.FC = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [errors, setErrors] = useState<{ email?: string }>({});
    const [isLoading, setIsLoading] = useState(false);

    const validate = (): boolean => {
        const newErrors: { email?: string } = {};

        if (!email.trim()) {
            newErrors.email = "Email is required.";
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = "Please enter a valid email.";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setIsLoading(true);
        try {
            const response = await AuthService.sendResetLink({ email });
            notify.success(response.data?.message || "Reset instructions were sent to your email.");
            navigate(PATHS.LOGIN, { replace: true });
        } catch (err) {
            const axiosErr = err as any;
            const status = axiosErr.response?.status;
            const data = axiosErr.response?.data;

            if (status === 422 && data?.errors) {
                setErrors({ email: data.errors.email?.[0] });
            } else if (data?.message) {
                notify.error(data.message);
            } else {
                notify.error("Unable to send reset link. Please try again.");
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
                        <h1 className="text-3xl font-black uppercase tracking-tighter text-text">Forgot Password</h1>
                        <p className="text-sm text-text-muted">
                            Enter your account email and we will send you a secure password reset link.
                        </p>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-6" id="forgot-password-form">
                        <InputField
                            label="Email"
                            name="email"
                            type="email"
                            placeholder="you@example.com"
                            iconName="FaEnvelope"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                if (errors.email) setErrors({ email: undefined });
                            }}
                            error={errors.email}
                            fullWidth
                            required
                            autoComplete="email"
                        />
                        <Button
                            type="submit"
                            variant="primary"
                            fullWidth
                            isLoading={isLoading}
                            loadingText="Sending..."
                            iconName="FaPaperPlane"
                            size="lg"
                            id="forgot-password-submit"
                        >
                            Send Reset Link
                        </Button>
                    </form>
                    <div className="mt-6 text-center text-sm text-text-muted">
                        <p>
                            Remembered your password?{' '}
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

export default ForgotPassword;

