"use client";

/** A row of words; the chosen one is in ink and underlined, the rest muted. */
export default function Choice<T extends string>({
  label,
  options,
  value,
  onChange,
  names,
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  names: Record<T, string>;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-x-[2ch]">
      {options.map((o) => (
        <button
          key={o}
          role="radio"
          aria-checked={o === value}
          onClick={() => onChange(o)}
          className={`cursor-pointer underline-offset-4 transition-colors duration-[160ms] ${
            o === value ? "text-ink underline decoration-ink" : "text-muted hover:text-ink"
          }`}
        >
          {names[o]}
        </button>
      ))}
    </div>
  );
}
