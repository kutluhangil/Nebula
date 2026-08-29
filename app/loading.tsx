/** Route-level loading state, shown while a page segment streams in. */
export default function Loading() {
  return (
    <div className="min-h-[60vh] w-full max-w-7xl px-4 pt-24 md:px-6 lg:px-8">
      <div className="glass-panel h-10 w-64 skeleton" aria-busy="true" />
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="glass-panel h-64 skeleton lg:col-span-2" aria-busy="true" />
        <div className="glass-panel h-64 skeleton" aria-busy="true" />
      </div>
      <span className="sr-only">Loading page…</span>
    </div>
  );
}
