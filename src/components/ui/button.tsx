import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "dark" | "outline" | "outline-light" | "light";
type Size = "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-[3px] font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60 whitespace-nowrap";

const variants: Record<Variant, string> = {
  primary: "bg-turf text-white hover:bg-turf-deep",
  dark: "bg-navy text-white hover:bg-navy-deep",
  outline: "border border-navy/25 text-navy hover:border-navy hover:bg-navy/[0.03]",
  "outline-light": "border border-white/35 text-white hover:border-white hover:bg-white/[0.06]",
  light: "bg-white text-navy hover:bg-paper",
};

const sizes: Record<Size, string> = {
  md: "min-h-11 px-4 text-[0.95rem]",
  lg: "min-h-12 px-5 text-base sm:min-h-13 sm:px-6",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", extra = "") {
  return `${base} ${variants[variant]} ${sizes[size]} ${extra}`;
}

type LinkButtonProps = Omit<ComponentProps<typeof Link>, "className"> & {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
};

export function LinkButton({ variant, size, className, children, ...props }: LinkButtonProps) {
  return (
    <Link {...props} className={buttonClass(variant, size, className)}>
      {children}
    </Link>
  );
}
