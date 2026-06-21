import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "teal" | "danger" | "back";
}

export function Button({ variant = "primary", className = "", children, ...props }: ButtonProps) {
  const cls = variant === "back" ? "btn-back" : `btn btn-${variant}`;
  return (
    <button className={`${cls} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}
