import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, RotateCcw } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useUploadPaper } from "@/hooks/usePaper";
import { usePrefetchSummary } from "@/hooks/useSummary";
import { validatePaperFile } from "@/lib/files";
import type { ResponseLanguage } from "@/lib/types";
import { UploadDropzone } from "./UploadDropzone";
import { UploadProgress } from "./UploadProgress";
import { PaperDetectedCard } from "./PaperDetectedCard";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function UploadFlow() {
  const upload = useUploadPaper();
  const prefetchSummary = usePrefetchSummary();
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showDetected, setShowDetected] = useState(false);
  const [lang, setLang] = useState<ResponseLanguage>("auto");
  const [step, setStep] = useState<number | null>(null);

  const paper = upload.data;

  useEffect(() => {
    if (!paper) return;
    const t = setTimeout(() => setShowDetected(true), 700);
    return () => clearTimeout(t);
  }, [paper]);

  const handleFile = (f: File) => {
    const err = validatePaperFile(f);
    setValidationError(err);
    if (err) return;
    setFile(f);
    upload.mutate(f);
  };

  const analyze = async () => {
    if (!paper) return;
    setStep(0);
    const summary = prefetchSummary(paper.id, lang);
    await wait(900);
    setStep(1);
    await wait(800);
    setStep(2);
    await summary;
    setStep(3);
    await wait(300);
    navigate({ to: "/paper/$id", params: { id: paper.id }, search: { lang } });
  };

  const reset = () => {
    upload.reset();
    setFile(null);
    setShowDetected(false);
  };

  const view = upload.isError ? "error" : showDetected && paper ? "detected" : file && (upload.isPending || paper) ? "progress" : "idle";

  return (
    <AnimatePresence mode="wait">
      <motion.div key={view} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
        {view === "idle" && <UploadDropzone onFile={handleFile} error={validationError} />}
        {view === "progress" && file && <UploadProgress filename={file.name} progress={upload.progress} done={!!paper} />}
        {view === "detected" && paper && (
          <PaperDetectedCard paper={paper} lang={lang} onLangChange={setLang} onAnalyze={analyze} analysisStep={step} />
        )}
        {view === "error" && (
          <div role="alert" className="rounded-3xl border bg-card p-8 text-center shadow-soft">
            <AlertCircle className="mx-auto size-6 text-destructive" aria-hidden />
            <p className="mt-3 font-semibold">The upload didn't complete.</p>
            <p className="mt-1 text-sm text-muted-foreground">Check your connection and try again.</p>
            <Button onClick={reset} variant="outline" className="mt-5 rounded-xl">
              <RotateCcw className="size-4" aria-hidden />Try again
            </Button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
