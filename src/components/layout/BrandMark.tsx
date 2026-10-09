import { BookOpenText } from "lucide-react";

export function BrandMark({ showName = true }: { showName?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span className="grid size-8 place-items-center rounded-xl bg-primary text-primary-foreground shadow-soft">
        <BookOpenText className="size-4" aria-hidden />
      </span>
      {showName && (
        <span className="text-sm font-semibold tracking-tight">AI Research Assistant</span>
      )}
    </span>
  );
}
