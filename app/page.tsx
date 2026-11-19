import Cliff from "@/components/cliff/Cliff";

export default function Home() {
  return (
    <main className="px-1 py-4 md:px-4">
      <div className="max-w-[90ch]">
        <h1>green wave</h1>
        <p className="text-muted">a traffic signal experiment. in progress.</p>
        <h2 className="mt-2">the cliff</h2>
        <Cliff />
      </div>
    </main>
  );
}
