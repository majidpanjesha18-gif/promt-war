import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  icon,
  className = "",
  disabled,
  ...props
}) => {
  const base =
    "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed";

  const sizeStyles = {
    sm: "px-2.5 py-1.5 text-xs gap-1.5",
    md: "px-3.5 py-2 text-sm gap-2",
    lg: "px-4.5 py-2.5 text-base gap-2.5",
  };

  const variantStyles = {
    primary:
      "bg-forest-900 text-white hover:bg-forest-800 focus:ring-forest-700 shadow-sm",
    secondary:
      "bg-forest-100 text-forest-900 hover:bg-forest-200 focus:ring-forest-400",
    danger:
      "bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500 shadow-sm",
    ghost:
      "text-charcoal hover:bg-forest-50 focus:ring-forest-300",
    outline:
      "border border-forest-300 text-forest-900 hover:bg-forest-50 focus:ring-forest-300",
  };

  return (
    <button
      className={`${base} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
};
