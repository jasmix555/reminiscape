export function Loading() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <div className="mb-4 h-16 w-16 animate-spin rounded-full border-8 border-yellow-900 border-t-transparent" />
        <p>Loading...</p>
      </div>
    </div>
  );
}
