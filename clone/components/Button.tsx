import { type ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-accent text-on-accent hover:brightness-110",
  secondary: "bg-surface-raised text-text border border-border hover:bg-surface",
  ghost: "bg-transparent text-text hover:bg-surface",
  danger: "bg-danger text-on-accent hover:brightness-110",
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

// Primitivo do components.md > StickyCTA e botões de ação. Estado desabilitado sempre some
// a opacidade, nunca o texto — um botão cinza sem explicação é a parte que mais frustra
// quem está com pressa num cardápio de celular.
export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = "primary", className = "", disabled, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-md px-4 h-14 text-base font-bold transition-colors duration-fast disabled:opacity-40 disabled:cursor-not-allowed ${VARIANT_CLASSES[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
});
