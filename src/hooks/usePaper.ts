import { useCallback, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getPaper, uploadPaper } from "@/lib/api";
import type { Paper } from "@/lib/types";

export const paperKey = (id: string) => ["paper", id] as const;

export function usePaper(id: string) {
  return useQuery({
    queryKey: paperKey(id),
    queryFn: () => getPaper(id),
    staleTime: 5 * 60_000,
  });
}

export function useUploadPaper() {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState(0);
  const mutation = useMutation({
    mutationFn: (file: File) => uploadPaper(file, setProgress),
    onMutate: () => setProgress(0),
    onSuccess: (paper: Paper) => queryClient.setQueryData(paperKey(paper.id), paper),
  });
  const reset = useCallback(() => {
    mutation.reset();
    setProgress(0);
  }, [mutation]);
  return { ...mutation, progress, reset };
}
