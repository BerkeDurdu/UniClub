function LoadingSpinner() {
  return (
    <div className="flex items-center gap-3 py-4 text-sm text-slate">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink border-t-transparent" />
      Loading data...
    </div>
  );
}

export default LoadingSpinner;
