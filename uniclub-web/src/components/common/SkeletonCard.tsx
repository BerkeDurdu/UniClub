function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-slate/20 bg-white p-5">
      <div className="mb-4 h-5 w-2/3 rounded bg-slate-200" />
      <div className="mb-2 h-3 w-1/3 rounded bg-slate-200" />
      <div className="h-3 w-full rounded bg-slate-200" />
    </div>
  );
}

export default SkeletonCard;
