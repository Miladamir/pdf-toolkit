import React from "react";

// Define the types of buttons we can have
type ButtonVariant = "primary" | "outline" | "ghost";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
    variant = "primary",
    children,
    className = "",
    ...props
}) => {
    // Base styles shared by all buttons
    const baseStyles =
        "px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

    // Styles specific to each variant
    const variants = {
        primary:
            "bg-primary text-white hover:bg-primary-hover focus:ring-primary shadow-md hover:shadow-lg",
        outline:
            "border-2 border-primary text-primary hover:bg-primary hover:text-white focus:ring-primary",
        ghost:
            "text-secondary-foreground hover:bg-secondary focus:ring-secondary",
    };

    // Combine the classes
    const combinedClassName = `${baseStyles} ${variants[variant]} ${className}`;

    return (
        <button className={combinedClassName} {...props}>
            {children}
        </button>
    );
};