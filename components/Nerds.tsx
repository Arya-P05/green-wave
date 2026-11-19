/** "For the nerds": the precise version, folded away so the story reads straight through. */
export default function Nerds({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details>
      <summary>for the nerds: {title}</summary>
      <div className="mt-1 grid gap-y-1 border-l border-faint pl-1 text-muted">{children}</div>
    </details>
  );
}
