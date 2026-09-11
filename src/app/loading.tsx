export default function Loading() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-16 space-y-8 animate-pulse">
      <div className="h-10 w-48 rounded-lg bg-muted mx-auto" />
      <div className="h-6 w-96 rounded-lg bg-muted mx-auto" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
        <div className="h-64 rounded-xl bg-muted" />
        <div className="h-64 rounded-xl bg-muted" />
        <div className="h-64 rounded-xl bg-muted" />
      </div>
    </div>
  );
}
