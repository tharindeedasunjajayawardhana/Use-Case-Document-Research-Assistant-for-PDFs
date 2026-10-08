import { useEffect, useRef } from "react";
import { AlertCircle, MessageSquareText, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChat } from "@/hooks/useChat";
import type { ResponseLanguage } from "@/lib/types";
import { ChatInput } from "./ChatInput";
import { ChatMessageItem } from "./ChatMessageItem";
import { TypingIndicator } from "./TypingIndicator";

const SUGGESTIONS = [
  "What was the main contribution?",
  "What dataset was used?",
  "What limitations did the authors mention?",
];

export function ChatTab({ paperId, lang }: { paperId: string; lang: ResponseLanguage }) {
  const { messages, ask, retry, isSending, isError } = useChat(paperId, lang);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, isSending]);

  return (
    <div className="flex min-h-[60vh] flex-col">
      <div className="flex-1">
        {messages.length === 0 ? (
          <div className="mx-auto flex max-w-lg flex-col items-center py-12 text-center">
            <span className="grid size-12 place-items-center rounded-2xl bg-primary-soft text-primary">
              <MessageSquareText className="size-5" aria-hidden />
            </span>
            <h2 className="mt-5 text-lg font-semibold tracking-tight">Ask anything about this paper</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              Answers are grounded in the uploaded paper, with page citations you can open and check.
            </p>
            <ul className="mt-7 grid w-full gap-2" aria-label="Suggested questions">
              {SUGGESTIONS.map((s) => (
                <li key={s}>
                  <button
                    type="button"
                    onClick={() => ask(s)}
                    disabled={isSending}
                    className="w-full rounded-xl border bg-card px-4 py-3 text-left text-sm shadow-soft transition-colors hover:border-primary/40 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <ol className="space-y-5 pb-6" aria-label="Conversation" aria-live="polite">
            {messages.map((m) => <ChatMessageItem key={m.id} message={m} />)}
          </ol>
        )}
        {isSending && <TypingIndicator />}
        {isError && !isSending && (
          <div role="alert" className="flex flex-wrap items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
            <AlertCircle className="size-4 text-destructive" aria-hidden />
            <span className="flex-1">We couldn't get an answer. Please try again.</span>
            <Button size="sm" variant="outline" onClick={retry} className="rounded-lg">
              <RotateCcw className="size-3.5" aria-hidden />Retry
            </Button>
          </div>
        )}
        <div ref={endRef} />
      </div>
      <div className="sticky bottom-0 -mx-1 mt-4 bg-gradient-to-t from-background via-background to-transparent px-1 pb-4 pt-6">
        <ChatInput onSend={ask} disabled={isSending} />
      </div>
    </div>
  );
}
