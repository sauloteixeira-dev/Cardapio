// components.md > FulfillmentOption. Um <fieldset><legend> real por trás, não divs com
// onClick — grupo de rádio de verdade é alcançável pelo teclado e lido corretamente.
export function FulfillmentOption({
  id,
  label,
  sublabel,
  icon,
  disabled,
  disabledReason,
  selected,
  onSelect,
}: {
  id: string;
  label: string;
  sublabel?: string;
  icon: string;
  disabled?: boolean;
  disabledReason?: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <label
      htmlFor={id}
      className={`flex items-center gap-3 p-4 rounded-md border mb-2 ${
        selected ? "border-accent border-2" : "border-border"
      } ${disabled ? "opacity-50" : "cursor-pointer"}`}
    >
      <span aria-hidden="true" className="text-xl">
        {icon}
      </span>
      <span className="flex-1">
        <span className="block font-semibold">{label}</span>
        {disabled && disabledReason ? (
          <span className="block text-xs text-muted">{disabledReason}</span>
        ) : sublabel ? (
          <span className="block text-xs text-success font-semibold">{sublabel}</span>
        ) : null}
      </span>
      <input
        id={id}
        type="radio"
        name="fulfillment"
        disabled={disabled}
        checked={selected}
        onChange={onSelect}
        className="w-5 h-5 accent-[color:var(--color-accent)]"
      />
    </label>
  );
}
