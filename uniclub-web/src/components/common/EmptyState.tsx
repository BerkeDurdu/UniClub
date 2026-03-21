import { SearchX } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
}

function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate/40 bg-white/70 p-10 text-center">
      <SearchX className="mb-3 h-10 w-10 text-slate" />
      <h3 className="headline text-xl font-semibold text-ink">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-slate">{description}</p>
    </div>
  );
}

export default EmptyState;
