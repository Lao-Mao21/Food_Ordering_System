import { useState, useEffect } from "react";
import Modal from "../../../components/ui/Modal";
import { notify } from "../../../util/notify";
import { InputField, FileUploadField, PasswordInputField, Radio } from "../../../components/ui/forms";
import type { User, Role } from "../../../interfaces/user";
import UserService from "../../../services/UserSerivce";

type Props = {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    user: User | null;
};

interface EditUserFormData {
    id: string | number;
    avatar: File | null;
    name: string;
    email: string;
    phone: string;
    password: string;
    password_confirmation: string;
    role: Role;
}

interface FormErrors {
    [key: string]: string;
}

const EditUserModal = ({ isOpen, onClose, onSuccess, user }: Props) => {
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});

    const initialFormState: EditUserFormData = {
        id: "",
        avatar: null,
        name: "",
        email: "",
        phone: "",
        password: "",
        password_confirmation: "",
        role: "guest",
    };

    const [form, setForm] = useState<EditUserFormData>(initialFormState);

    // Pre-populate form when a user is selected
    useEffect(() => {
        if (user) {
            setForm({
                id: user.id ?? "",
                avatar: null,
                name: user.name ?? "",
                email: user.email ?? "",
                phone: user.phone ?? "",
                password: "",
                password_confirmation: "",
                role: user.role ?? "guest",
            });
            setErrors({});
        }
    }, [user]);

    const handleFileSelect = (files: File[]) => {
        setForm((prev) => ({
            ...prev,
            avatar: files[0] || null,
        }));
        // Clear avatar error when a file is selected
        if (errors.avatar) {
            setErrors((prev) => {
                const { avatar, ...rest } = prev;
                return rest;
            });
        }
    };

    const handleChange = (name: string, value: string | Role) => {
        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));
        // Clear field error when user starts typing
        if (errors[name]) {
            setErrors((prev) => {
                const { [name]: _, ...rest } = prev;
                return rest;
            });
        }
    };

    const handleSubmit = async () => {
        if (!user) return;

        setIsLoading(true);
        setErrors({});

        try {
            // Build FormData for multipart/form-data submission
            const formData = new FormData();
            formData.append("name", form.name);
            formData.append("email", form.email);
            formData.append("phone", form.phone);
            formData.append("role", form.role);

            // Only include password fields if the user is changing the password
            if (form.password) {
                formData.append("password", form.password);
                formData.append("password_confirmation", form.password_confirmation);
            }

            if (form.avatar) {
                formData.append("avatar", form.avatar);
            }

            // Laravel requires _method override for PUT with multipart/form-data
            formData.append("_method", "PUT");

            await UserService.update(user.id, formData);
            notify.success("User updated successfully!");
            setErrors({});
            onClose();
            onSuccess();

        } catch (error: any) {
            // Extract validation errors from Laravel response
            const validationErrors = error.response?.data?.errors;

            if (validationErrors && typeof validationErrors === 'object') {
                // Convert array errors to strings (take first error message for each field)
                const formattedErrors: FormErrors = {};
                for (const [field, messages] of Object.entries(validationErrors)) {
                    if (Array.isArray(messages) && messages.length > 0) {
                        formattedErrors[field] = messages[0] as string;
                    }
                }
                notify.error("Some fields are incomplete or contain invalid information. Please review them.");
                setErrors(formattedErrors);
            } else {
                notify.error(error?.message || "Failed to update user");
            }
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Edit User"
            size="md"
            primaryAction={{
                label: "Update",
                onClick: handleSubmit,
                variant: "primary",
                iconName: "FaFloppyDisk",
                isLoading,
                loadingText: "Updating User..."
            }}
            secondaryAction={{
                label: "Cancel",
                onClick: onClose,
                variant: "secondary",
            }}
        >
            <form className="space-y-4">

                <FileUploadField
                    label="Avatar"
                    name="avatar"
                    accept="image/jpg,image/jpeg,image/png"
                    onFileSelect={handleFileSelect}
                    error={errors.avatar}
                    fullWidth
                />

                <InputField
                    name="name"
                    label="Name"
                    type="text"
                    placeholder="Enter full name"
                    required
                    fullWidth
                    value={form.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    iconName="FaUser"
                    error={errors.name}
                />

                <InputField
                    name="email"
                    label="Email"
                    type="email"
                    placeholder="Enter email address"
                    required
                    fullWidth
                    value={form.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    iconName="FaEnvelope"
                    error={errors.email}
                />

                <InputField
                    name="phone"
                    label="Phone"
                    type="tel"
                    placeholder="Enter phone number"
                    fullWidth
                    value={form.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    iconName="FaPhone"
                    error={errors.phone}
                />

                <PasswordInputField
                    name="password"
                    label="New Password"
                    placeholder="Leave blank to keep current password"
                    fullWidth
                    value={form.password}
                    onChange={(e) => handleChange("password", e.target.value)}
                    error={errors.password}
                />

                <PasswordInputField
                    name="password_confirmation"
                    label="Confirm New Password"
                    placeholder="Confirm new password"
                    fullWidth
                    value={form.password_confirmation}
                    onChange={(e) => handleChange("password_confirmation", e.target.value)}
                    error={errors.password_confirmation}
                />

                <div className="flex flex-col gap-2">
                    <label className="text-sm text-text-muted font-semibold uppercase tracking-wider ml-1 flex items-center gap-1">
                        Role
                    </label>
                    <div className="inline-flex gap-3">
                        <Radio
                            name="role"
                            label="Guest"
                            value="guest"
                            checked={form.role === "guest"}
                            onChange={() => handleChange("role", "guest")}
                        />
                        <Radio
                            name="role"
                            label="Admin"
                            value="admin"
                            checked={form.role === "admin"}
                            onChange={() => handleChange("role", "admin")}
                        />
                    </div>
                </div>

            </form>
        </Modal>
    );
};

export default EditUserModal;
