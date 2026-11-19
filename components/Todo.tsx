/** Placeholder prose for Arya to write. Deliberately loud so none of it ships by accident. */
export default function Todo({ children }: { children: React.ReactNode }) {
  return (
    <p className="my-1 border-l border-amber pl-1 text-muted italic">
      <span className="not-italic text-ink">todo</span> {children}
    </p>
  );
}
