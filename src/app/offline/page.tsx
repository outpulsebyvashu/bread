export default function OfflinePage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-2 p-6">
      <h1 className="text-4xl font-light tracking-tight">
        <span className="text-muted">You&apos;re</span> offline
      </h1>
      <p className="text-sm text-muted">breadPOS needs a connection right now. It will work again once you&apos;re back online.</p>
    </main>
  );
}
