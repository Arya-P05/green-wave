/** The line above every figure: what you're looking at, and one thing to try. */
export default function Try({ look, children }: { look?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <p className="text-muted">
      {look && (
        <>
          <span className="text-ink">What you’re looking at:</span> {look}{" "}
        </>
      )}
      {children && (
        <>
          <span className="text-ink">Try this:</span> {children}
        </>
      )}
    </p>
  );
}
