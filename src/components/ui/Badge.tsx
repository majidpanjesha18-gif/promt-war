import React from "react";

export type BadgeVariant =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral"
  | "forest"
  | "lime";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "neutral",
  className = "",
}) => {
  const styles: Record<BadgeVariant, string> = {
    success: "bg-emerald-50 text-emerald-800 border-emerald-200",
    warning: "bg-amber-50 text-amber-800 border-amber-200",
    danger: "bg-rose-50 text-rose-800 border-rose-200",
    info: "bg-blue-50 text-blue-800 border-blue-200",
    neutral: "bg-gray-100 text-gray-700 border-gray-200",
    forest: "bg-forest-50 text-forest-800 border-forest-200 font-medium",
    lime: "bg-lime-50 text-lime-900 border-lime-200 font-medium",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border ${styles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
