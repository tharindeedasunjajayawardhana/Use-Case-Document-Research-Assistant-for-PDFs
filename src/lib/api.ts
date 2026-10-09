/**
 * The single data-access boundary of the app.
 * Components → hooks → this file → mock data OR the FastAPI backend.
 *
 * Backend contract (when USE_MOCK = false):
 *   POST /papers                  multipart "file"         → Paper
 *   GET  /papers/:id                                        → Paper
 *   GET  /papers/:id/summary?lang=<ResponseLanguage>        → Summary
 *   POST /papers/:id/chat         { question, lang }        → ChatMessage
 */
import type { ChatMessage, Paper, ResponseLanguage, Source, Summary } from "./types";

export const USE_MOCK = true;

const API_URL = (import.meta.env["VITE_API_URL"] as string | undefined)?.replace(/\/$/, "") ?? "";

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/* ------------------------------------------------------------------ */
/* Real API                                                            */
/* ------------------------------------------------------------------ */

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_URL) throw new ApiError("The research service is not configured.");
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { Accept: "application/json", ...(init?.headers ?? {}) },
    });
  } catch {
    throw new ApiError("We couldn't reach the research service.");
  }
  if (!res.ok) throw new ApiError("The research service returned an error.", res.status);
  return (await res.json()) as T;
}

const realApi = {
  uploadPaper(file: File, onProgress: (pct: number) => void): Promise<Paper> {
    return new Promise((resolve, reject) => {
      if (!API_URL) return reject(new ApiError("The research service is not configured."));
      const xhr = new XMLHttpRequest();
      const body = new FormData();
      body.append("file", file);
      xhr.open("POST", `${API_URL}/papers`);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          onProgress(100);
          resolve(JSON.parse(xhr.responseText) as Paper);
        } else reject(new ApiError("Upload failed.", xhr.status));
      };
      xhr.onerror = () => reject(new ApiError("Upload failed."));
      xhr.send(body);
    });
  },
  getPaper: (id: string) => request<Paper>(`/papers/${encodeURIComponent(id)}`),
  getSummary: (id: string, lang: ResponseLanguage) =>
    request<Summary>(`/papers/${encodeURIComponent(id)}/summary?lang=${encodeURIComponent(lang)}`),
  sendChat: (id: string, question: string, lang: ResponseLanguage) =>
    request<ChatMessage>(`/papers/${encodeURIComponent(id)}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, lang }),
    }),
};

/* ------------------------------------------------------------------ */
/* Mock API                                                            */
/* ------------------------------------------------------------------ */

const delay = (min = 800, max = 1500) =>
  new Promise<void>((r) => setTimeout(r, min + Math.random() * (max - min)));

const MOCK_PAPER: Paper = {
  id: "aiayn-7f3a2c",
  filename: "attention-is-all-you-need-ja.pdf",
  language: "ja",
  language_name: "Japanese",
  page_count: 18,
  status: "ready",
  low_text_pages: [12, 13],
};

const AUTHORS = ["Ashish Vaswani", "Noam Shazeer", "Niki Parmar"];

const SUMMARIES: Record<"en" | "ja" | "si", Summary> = {
  en: {
    title: "Attention Is All You Need",
    authors: AUTHORS,
    abstract: {
      text: "The paper introduces the Transformer, a sequence transduction architecture built entirely on attention mechanisms, dispensing with recurrence and convolutions. On two machine translation benchmarks the model achieves superior quality while being more parallelizable and requiring significantly less time to train.",
      sources: [1],
    },
    problem_statement: {
      text: "Dominant sequence models rely on recurrent or convolutional networks that process tokens sequentially. This inherent sequential computation precludes parallelization within training examples and makes learning dependencies between distant positions harder, which becomes critical at longer sequence lengths.",
      sources: [1, 2],
    },
    methodology: {
      text: "The Transformer follows an encoder–decoder structure with six stacked layers on each side. Each layer combines multi-head scaled dot-product self-attention with position-wise feed-forward networks, residual connections and layer normalization. Since the model has no recurrence, sinusoidal positional encodings inject information about token order. The authors also compare self-attention with recurrent and convolutional layers in terms of complexity, parallelism and path length.",
      sources: [3, 4, 5, 6],
    },
    key_results: {
      text: "The big Transformer reaches 28.4 BLEU on WMT 2014 English-to-German, improving over the previous best results, including ensembles, by more than 2 BLEU. On WMT 2014 English-to-French it sets a new single-model state of the art of 41.8 BLEU after training for 3.5 days on eight GPUs — a small fraction of the training cost of prior models. The architecture also generalizes well to English constituency parsing.",
      sources: [8, 9, 10],
    },
    conclusion: {
      text: "The authors conclude that attention-only models can be trained substantially faster than recurrent or convolutional architectures while achieving higher translation quality. They plan to extend the Transformer to other modalities such as images, audio and video, and to investigate local, restricted attention for handling very large inputs.",
      sources: [10],
    },
  },
  ja: {
    title: "Attention Is All You Need",
    authors: AUTHORS,
    abstract: {
      text: "本論文は、再帰や畳み込みを用いず、注意機構のみに基づく系列変換モデル「Transformer」を提案する。二つの機械翻訳タスクにおいて、より高い品質を達成しつつ、並列化が容易で学習時間を大幅に短縮できることを示している。",
      sources: [1],
    },
    problem_statement: {
      text: "従来の主要な系列モデルは、トークンを逐次的に処理する再帰型または畳み込み型ネットワークに依存している。この逐次計算は学習時の並列化を妨げ、離れた位置間の依存関係の学習を困難にする。",
      sources: [1, 2],
    },
    methodology: {
      text: "Transformer はエンコーダ・デコーダ構造を持ち、それぞれ6層を積み重ねる。各層はマルチヘッドのスケール化内積自己注意と位置ごとのフィードフォワードネットワークで構成され、残差接続と層正規化を用いる。再帰がないため、正弦波による位置エンコーディングで語順の情報を与える。",
      sources: [3, 4, 5, 6],
    },
    key_results: {
      text: "大規模モデルは WMT 2014 英独翻訳で 28.4 BLEU を達成し、アンサンブルを含む既存の最高結果を 2 BLEU 以上上回った。英仏翻訳では 8 GPU で 3.5 日の学習により、単一モデルとして最高の 41.8 BLEU を記録した。英語の構文解析にも良好に汎化する。",
      sources: [8, 9, 10],
    },
    conclusion: {
      text: "著者らは、注意機構のみのモデルが再帰型・畳み込み型より大幅に高速に学習でき、翻訳品質も高いと結論づけている。今後は画像・音声・動画など他のモダリティへの拡張や、大規模入力のための局所的な注意機構を検討するとしている。",
      sources: [10],
    },
  },
  si: {
    title: "Attention Is All You Need",
    authors: AUTHORS,
    abstract: {
      text: "මෙම පත්‍රිකාව පුනරාවර්තනය හෝ සංවලනය භාවිතා නොකර, අවධාන යාන්ත්‍රණ මත පමණක් ගොඩනැගූ Transformer ආකෘතිය හඳුන්වා දෙයි. යන්ත්‍ර පරිවර්තන කාර්යයන් දෙකකදී එය වඩා හොඳ ගුණාත්මකභාවයක් ලබා දෙන අතර පුහුණු කාලය සැලකිය යුතු ලෙස අඩු කරයි.",
      sources: [1],
    },
    problem_statement: {
      text: "පවතින අනුක්‍රමික ආකෘති ටෝකන එකින් එක සකසන පුනරාවර්තී හෝ සංවලන ජාල මත රඳා පවතී. මෙය පුහුණුවේදී සමාන්තරකරණය වළක්වන අතර දුරස්ථ ස්ථාන අතර සම්බන්ධතා ඉගෙනීම අපහසු කරයි.",
      sources: [1, 2],
    },
    methodology: {
      text: "Transformer හි එන්කෝඩර්-ඩිකෝඩර් ව්‍යුහයක් ඇති අතර එක් එක් පැත්තේ ස්ථර හයක් ඇත. සෑම ස්ථරයක්ම බහු-හිස් ස්වයං-අවධානය සහ ස්ථාන අනුව ක්‍රියාත්මක වන ජාල ඒකාබද්ධ කරයි. වචන අනුපිළිවෙල ලබා දීමට සයින් ආකාර ස්ථාන කේතනය භාවිතා කෙරේ.",
      sources: [3, 4, 5, 6],
    },
    key_results: {
      text: "විශාල ආකෘතිය WMT 2014 ඉංග්‍රීසි-ජර්මන් පරිවර්තනයේදී BLEU 28.4 ක් ලබා ගත් අතර ඉංග්‍රීසි-ප්‍රංශ පරිවර්තනයේදී GPU අටක් මත දින 3.5 ක පුහුණුවකින් BLEU 41.8 ක් ලබා ගත්තේය.",
      sources: [8, 9, 10],
    },
    conclusion: {
      text: "අවධානය පමණක් භාවිතා කරන ආකෘති වේගයෙන් පුහුණු කළ හැකි අතර ඉහළ ගුණාත්මකභාවයක් ලබා දෙන බව කතුවරුන් නිගමනය කරයි. රූප, ශ්‍රව්‍ය සහ වීඩියෝ වැනි වෙනත් ක්ෂේත්‍රවලට එය දිගු කිරීමට ඔවුහු සැලසුම් කරති.",
      sources: [10],
    },
  },
};

type Topic = {
  keywords: RegExp;
  content: Partial<Record<"en" | "ja" | "si", string>> & { en: string };
  sources: Source[];
};

const SNIPPETS: Record<number, string> = {
  2: "The inherently sequential nature of recurrent models precludes parallelization within training examples, which becomes critical at longer sequence lengths.",
  3: "The Transformer follows this overall architecture using stacked self-attention and point-wise, fully connected layers for both the encoder and decoder.",
  4: "Multi-head attention allows the model to jointly attend to information from different representation subspaces at different positions.",
  5: "Since our model contains no recurrence and no convolution, we must inject some information about the relative or absolute position of the tokens in the sequence.",
  6: "Self-attention could be restricted to considering only a neighborhood of size r in the input sequence centered around the respective output position.",
  7: "We trained on the standard WMT 2014 English-German dataset consisting of about 4.5 million sentence pairs… For English-French, we used the significantly larger WMT 2014 English-French dataset consisting of 36M sentences.",
  8: "On the WMT 2014 English-to-German translation task, the big transformer model outperforms the best previously reported models (including ensembles) by more than 2.0 BLEU, establishing a new state-of-the-art BLEU score of 28.4.",
  9: "Table 3: Variations on the Transformer architecture… reducing the attention key size dk hurts model quality.",
  10: "We are excited about the future of attention-based models… We plan to extend the Transformer to problems involving input and output modalities other than text.",
};

const src = (...pages: number[]): Source[] =>
  pages.map((page) => ({ page, snippet: SNIPPETS[page] ?? "" }));

const TOPICS: Topic[] = [
  {
    keywords: /contribution|novel|main idea|propos|貢献|提案|දායකත්ව/i,
    content: {
      en: "The main contribution is the Transformer, the first sequence transduction model based entirely on attention, replacing the recurrent layers commonly used in encoder–decoder architectures. [Page 2]\n\nIts core building block is multi-head scaled dot-product attention, which lets every position attend to all others in a single step and allows computation to be fully parallelized across the sequence. [Pages 3–4]\n\nThe authors show this design reaches state-of-the-art translation quality at a fraction of the training cost of earlier models. [Page 8]",
      ja: "主な貢献は、再帰層を完全に注意機構で置き換えた初の系列変換モデル Transformer の提案です。[Page 2]\n\n中心となるのはマルチヘッドのスケール化内積注意で、各位置が一度に全位置を参照でき、系列全体で計算を並列化できます。[Pages 3–4]\n\nこの設計により、従来より大幅に少ない学習コストで最高水準の翻訳品質を達成しています。[Page 8]",
      si: "ප්‍රධාන දායකත්වය වන්නේ සම්පූර්ණයෙන්ම අවධානය මත පදනම් වූ Transformer ආකෘතියයි. [Page 2]\n\nබහු-හිස් අවධානය මගින් සෑම ස්ථානයකටම අනෙක් සියලු ස්ථාන එකවර සලකා බැලිය හැක. [Pages 3–4]\n\nමෙය අඩු පුහුණු පිරිවැයකින් ඉහළම පරිවර්තන ගුණාත්මකභාවය ලබා දෙයි. [Page 8]",
    },
    sources: src(2, 3, 4, 8),
  },
  {
    keywords: /dataset|data|corpus|wmt|train(ing)? (set|data)|データ|දත්ත/i,
    content: {
      en: "For machine translation, the authors trained on the WMT 2014 English–German dataset of about 4.5 million sentence pairs, encoded with byte-pair encoding into a shared vocabulary of roughly 37,000 tokens. [Page 7]\n\nFor English–French they used the much larger WMT 2014 English–French dataset of 36 million sentences, with a 32,000 word-piece vocabulary. [Page 7]\n\nTo test generalization, they also trained on the Wall Street Journal portion of the Penn Treebank (about 40,000 sentences) for English constituency parsing. [Page 10]",
    },
    sources: src(7, 10),
  },
  {
    keywords: /limit|weakness|drawback|future|shortcoming|制限|限界|課題|සීමා/i,
    content: {
      en: "The authors note that averaging attention-weighted positions reduces effective resolution, which they counteract with multi-head attention. [Page 2]\n\nThey also point out that self-attention scales quadratically with sequence length and suggest restricting attention to a local neighborhood for very long inputs, at the cost of a longer maximum path length. [Page 6]\n\nAs future work, they mention applying the model to images, audio and video, and making generation less sequential. [Page 10]",
    },
    sources: src(2, 6, 10),
  },
  {
    keywords: /result|bleu|perform|score|accura|faster|speed|gpu|cost|time|結果|性能|ප්‍රතිඵල/i,
    content: {
      en: "The big Transformer reached 28.4 BLEU on WMT 2014 English–German, more than 2 BLEU above the previous best results including ensembles. [Page 8]\n\nOn English–French it achieved 41.8 BLEU as a single model after 3.5 days of training on eight P100 GPUs, while the base model trained in about 12 hours. [Pages 7–8]\n\nAblations show that reducing the attention key size, or using a single head, hurts quality. [Page 9]",
    },
    sources: src(7, 8, 9),
  },
  {
    keywords: /attention|head|architecture|encoder|decoder|position|注意|構造|අවධාන/i,
    content: {
      en: "The encoder and decoder are each a stack of six identical layers combining self-attention with position-wise feed-forward networks, wrapped in residual connections and layer normalization. [Page 3]\n\nAttention is computed as scaled dot products between queries and keys; eight parallel heads let the model attend to different representation subspaces at once. [Page 4]\n\nBecause there is no recurrence, sinusoidal positional encodings are added to the input embeddings to convey token order. [Page 5]",
    },
    sources: src(3, 4, 5),
  },
];

const NO_ANSWER: Record<"en" | "ja" | "si", string> = {
  en: "I couldn't find a passage in this paper that directly answers that question. Try rephrasing it, or ask about the model architecture, datasets, results, or limitations described by the authors.",
  ja: "この論文の中に、その質問に直接答える箇所は見つかりませんでした。モデル構造、データセット、結果、限界などについて質問してみてください。",
  si: "මෙම පත්‍රිකාවේ එම ප්‍රශ්නයට සෘජුව පිළිතුරු දෙන කොටසක් සොයාගත නොහැකි විය. ආකෘතිය, දත්ත කට්ටල, ප්‍රතිඵල හෝ සීමාවන් ගැන විමසන්න.",
};

/** Auto = respond in the language of the question. */
function resolveLanguage(lang: ResponseLanguage, question = ""): "en" | "ja" | "si" {
  if (lang !== "auto") return lang;
  if (/[\u3040-\u30ff\u4e00-\u9faf]/.test(question)) return "ja";
  if (/[\u0d80-\u0dff]/.test(question)) return "si";
  return "en";
}

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const mockApi = {
  async uploadPaper(_file: File, onProgress: (pct: number) => void): Promise<Paper> {
    for (const pct of [0, 15, 31, 48, 67, 82, 94, 100]) {
      onProgress(pct);
      await delay(180, 320);
    }
    return { ...MOCK_PAPER };
  },
  async getPaper(id: string): Promise<Paper> {
    await delay();
    if (id !== MOCK_PAPER.id) throw new ApiError("Paper not found.", 404);
    return { ...MOCK_PAPER };
  },
  async getSummary(id: string, lang: ResponseLanguage): Promise<Summary> {
    await delay();
    if (id !== MOCK_PAPER.id) throw new ApiError("Paper not found.", 404);
    return SUMMARIES[resolveLanguage(lang)];
  },
  async sendChat(id: string, question: string, lang: ResponseLanguage): Promise<ChatMessage> {
    await delay();
    if (id !== MOCK_PAPER.id) throw new ApiError("Paper not found.", 404);
    const resolved = resolveLanguage(lang, question);
    const topic = TOPICS.find((t) => t.keywords.test(question));
    return {
      id: newId(),
      role: "assistant",
      content: topic ? (topic.content[resolved] ?? topic.content.en) : NO_ANSWER[resolved],
      sources: topic?.sources ?? [],
    };
  },
};

const api = USE_MOCK ? mockApi : realApi;

export const uploadPaper = (file: File, onProgress: (pct: number) => void) =>
  api.uploadPaper(file, onProgress);
export const getPaper = (id: string) => api.getPaper(id);
export const getSummary = (id: string, lang: ResponseLanguage) => api.getSummary(id, lang);
export const sendChat = (id: string, question: string, lang: ResponseLanguage) =>
  api.sendChat(id, question, lang);
