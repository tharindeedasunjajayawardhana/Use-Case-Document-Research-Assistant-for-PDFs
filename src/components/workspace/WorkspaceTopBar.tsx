import { Link } from "@tanstack/react-router";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { BrandMark } from "@/components/layout/BrandMark";
import { ResponseLanguageSelect } from "@/components/layout/ResponseLanguageSelect";
import { languageFlag } from "@/lib/languages";
import type { Paper, ResponseLanguage } from "@/lib/types";

interface Props {
  paper: Paper;
  title?: string;
  lang: ResponseLanguage;
  onLangChange: (l: ResponseLanguage) => void;
}

export function WorkspaceTopBar({ paper, title, lang, onLangChange }: Props) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3 sm:px-6">
        <Link to="/" aria-label="AI Research Assistant home" className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <BrandMark showName={false} />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-semibold tracking-tight sm:text-base">{title ?? paper.filename}</h1>
          <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
            <span className="truncate">{paper.filename}</span>
            <span aria-hidden>·</span>
            <span>
              <span aria-hidden>{languageFlag(paper.language)} </span>
              {paper.language_name} · {paper.page_count} pages
            </span>
          </p>
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <ResponseLanguageSelect compact value={lang} onChange={onLangChange} />
          <Button asChild variant="outline" size="sm" className="ml-auto h-9 rounded-xl sm:ml-0">
            <Link to="/"><Upload className="size-4" aria-hidden />Upload New Paper</Link>
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
