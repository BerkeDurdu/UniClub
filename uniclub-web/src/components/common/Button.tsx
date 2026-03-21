import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

type Variant = "primary" | "secondary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  isLoading?: boolean;
}

const variantMap: Record<Variant, string> = {
  primary: "bg-ink text-white hover:bg-[#0a1b2f]",
  secondary: "bg-signal text-white hover:bg-[#d66f45]",
  ghost: "bg-white text-ink border border-slate/30 hover:bg-mist",
};

function Button({
  children,
  variant = "primary",
  isLoading,
  className = "",
  disabled,
  ...props
}: PropsWithChildren<ButtonProps>) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${variantMap[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? "Yukleniyor..." : children}
    </button>
  );
}

export default Button;
