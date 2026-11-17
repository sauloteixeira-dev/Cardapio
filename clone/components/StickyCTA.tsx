import { Button } from "./Button";

// components.md > StickyCTA. "reason" é o texto que explica por que o botão está
// desabilitado — nunca deixamos um botão cinza sem dizer o motivo.
export function StickyCTA({
  label,
  totalLabel,
  disabled,
  reason,
  onClick,
  loading,
}: {
  label: string;
  totalLabel?: string;
  disabled?: boolean;
  reason?: string;
  onClick?: () => void;
  loading?: boolean;
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-bg/95 backdrop-blur border-t border-border p-4 pb-safe">
      {disabled && reason ? <p className="text-xs text-muted text-center mb-2">{reason}</p> : null}
      <Button className="w-full justify-between" disabled={disabled || loading} onClick={onClick}>
        <span>{loading ? "Processando…" : label}</span>
        {totalLabel ? <span>{totalLabel}</span> : null}
      </Button>
    </div>
  );
}
