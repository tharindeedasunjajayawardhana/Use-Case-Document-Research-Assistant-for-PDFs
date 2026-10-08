// All application/domain types live here. Mirrors the FastAPI backend contract.

export type Language = "ja" | "en" | "si" | "zh" | "es" | "fr" | "de" | "other";

export type ResponseLanguage = "auto" | "en" | "ja" | "si";

export interface Paper {
  id: string;
  filename: string;
  language: Language;
  language_name: string;
  page_count: number;
  status: "processing" | "ready" | "failed";
  low_text_pages: number[];
}

export interface SourcedText {
  text: string;
  sources: number[];
}

export interface Summary {
  title: string;
  authors: string[];
  abstract: SourcedText;
  problem_statement: SourcedText;
  methodology: SourcedText;
  key_results: SourcedText;
  conclusion: SourcedText;
}

export interface Source {
  page: number;
  snippet: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources: Source[];
}
