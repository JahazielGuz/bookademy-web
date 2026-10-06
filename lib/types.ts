// Mirrors bookademy-core's serialisers. Changing one means changing the other.

export type Language = "python" | "javascript";

export type DocumentStatus =
  | "pending"
  | "uploading"
  | "outlining"
  | "generating"
  | "ready"
  | "failed";

export type TopicStatus = "pending" | "generating" | "ready" | "failed";

/** A topic is one kind of thing: reading with exercises, or questions. */
export type TopicKind = "lesson" | "quiz";

export type DocumentSummary = {
  id: number;
  title: string;
  page_count: number | null;
  status: DocumentStatus;
  error: string;
  created_at: string;
  syllabus_id: number | null;
  topics_total: number;
  topics_ready: number;
  chapters_total: number;
  chapters_ready: number;
  cost_usd: number;
  calls_made: number;
  spend_limit_usd: number;
};

export type TopicSummary = {
  id: number;
  position: number;
  kind: TopicKind;
  title: string;
  summary: string;
  status: TopicStatus;
  steps_total: number;
  steps_completed: number;
  quiz_passed: boolean;
  complete: boolean;
};

export type ChapterStatus = "pending" | "generating" | "ready" | "failed";

export type Chapter = {
  id: number;
  number: number;
  title: string;
  summary: string;
  page_start: number;
  page_end: number;
  status: ChapterStatus;
  topics: TopicSummary[];
};

export type Syllabus = {
  id: number;
  title: string;
  subject: string;
  description: string;
  language: Language;
  chapters: Chapter[];
};

export type Step = {
  id: number;
  number: number;
  instruction_markdown: string;
  explanation_markdown: string;
  starter_code: string;
  // The ghost text is rendered from this. The server still decides whether a
  // submission passes.
  expected_code: string;
  hint: string;
  completed: boolean;
  unlocked: boolean;
};

export type Exercise = {
  id: number;
  position: number;
  title: string;
  scenario_markdown: string;
  language: Language;
  steps: Step[];
};

export type Question = {
  id: number;
  position: number;
  prompt: string;
  choices: string[];
};

export type Quiz = {
  id: number;
  questions: Question[];
  best_score: number | null;
};

export type Lesson = {
  id: number;
  title: string;
  body_markdown: string;
};

export type TopicDetail = {
  id: number;
  position: number;
  kind: TopicKind;
  title: string;
  summary: string;
  key_points: string[];
  status: TopicStatus;
  error: string;
  chapter_number: number;
  chapter_title: string;
  document_id: number;
  lesson: Lesson | null;
  quiz: Quiz | null;
  exercises: Exercise[];
};

export type CheckResponse = {
  passed: boolean;
  first_mismatch_line: number | null;
  next_step_id: number | null;
};

export type QuizResult = {
  question_id: number;
  chosen_index: number;
  correct_index: number;
  correct: boolean;
  explanation: string;
};

export type QuizAttemptResponse = {
  score: number;
  total: number;
  passed: boolean;
  results: QuizResult[];
};

export type GenerationEventKind =
  | "started"
  | "uploaded"
  | "syllabus_ready"
  | "chapter_started"
  | "topic_ready"
  | "chapter_ready"
  | "failed"
  | "done";

export type GenerationEvent = {
  id: number;
  kind: GenerationEventKind;
  message: string;
  chapter_number: number | null;
};
