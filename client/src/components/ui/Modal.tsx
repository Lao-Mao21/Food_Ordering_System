import React, { useEffect, useRef } from "react";
import * as FaIcons from 'react-icons/fa6';
import { Button, type ButtonVariant } from "./index";
import { useOnClickOutside } from "../../hooks/useOnClickOutside";

interface ModalAction {
    label: string;
    onClick: () => void | Promise<void>;
    isLoading?: boolean;
    loadingText?: string;
    variant?: ButtonVariant;
    iconName?: keyof typeof FaIcons;
}

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    primaryAction?: ModalAction;
    secondaryAction?: ModalAction;
    footer?: React.ReactNode;
    size?: "sm" | "md" | "lg" | "xl" | "custom";
    customSize?: string;
}

export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    primaryAction,
    secondaryAction,
    footer,
    size = "md",
    customSize,
}) => {
    const modalRef = useRef<HTMLDivElement>(null);

    // Prevent Closing When Submitting
    useOnClickOutside(modalRef, () => {
        if (!primaryAction?.isLoading) onClose();
    });

    const handleEsc = (e: KeyboardEvent) => {
        if (e.key === "Escape" && !primaryAction?.isLoading) {
            onClose();
        }
    };

    useEffect(() => {
        if (!isOpen) return;

        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [isOpen, primaryAction?.isLoading]);

    if (!isOpen) return null;

    const sizeClasses = {
        sm: "max-w-md",
        md: "max-w-lg",
        lg: "max-w-2xl",
        xl: "max-w-4xl",
    };

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-6">

            {/* Overlay */}
            <div className="fixed inset-0 bg-bg-dark/10 backdrop-blur-xs" />

            {/* Modal */}
            <div
                ref={modalRef}
                className={`relative w-full ${size !== "custom" ? sizeClasses[size] : ""} 
                bg-bg-main border border-border-muted shadow rounded-[2.5rem] flex flex-col overflow-hidden`}
                style={size === "custom" && customSize ? { maxWidth: customSize } : undefined}>
                {/* Header */}
                <div className="px-8 py-6 flex items-center justify-between border-b border-border bg-bg-main/30">
                    <h2 className="text-xl font-black uppercase italic tracking-tighter text-text">
                        {title}
                    </h2>

                    <Button
                        variant="secondary"
                        size="sm"
                        tooltip="Close"
                        tooltipPosition="left"
                        iconName="FaXmark"
                        onClick={onClose}
                        className="shadow-none outline-0 border-none"
                        disabled={primaryAction?.isLoading}>
                    </Button>
                </div>

                {/* Content */}
                <div className="p-8 max-h-[70vh] overflow-y-auto flex-1 text-text italic">
                    {children}
                </div>

                {/* Footer */}
                {(footer || primaryAction || secondaryAction) && (
                    <div className="px-8 py-6 border-t border-border-muted bg-bg-main/30 flex justify-end items-center gap-3">
                        {footer ? (
                            footer
                        ) : (
                            <>
                                {secondaryAction && (
                                    <Button
                                        variant={secondaryAction.variant || "secondary"}
                                        onClick={secondaryAction.onClick}
                                        size="md"
                                        disabled={primaryAction?.isLoading}
                                    >
                                        {secondaryAction.label}
                                    </Button>
                                )}

                                {primaryAction && (
                                    <Button
                                        variant={primaryAction.variant || "primary"}
                                        onClick={primaryAction.onClick}
                                        isLoading={primaryAction.isLoading}
                                        loadingText={primaryAction.loadingText}
                                        iconName={primaryAction.iconName}
                                        size="md">
                                        {primaryAction.label}
                                    </Button>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Modal;