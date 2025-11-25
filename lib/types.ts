export type Tutorial = {
  id: string;
  topic: string;
  created_at: string;
  steps: Step[];
};

export type Step = {
  id: string;
  tutorial_id: string;
  title: string;
  content: string;
  command?: string;
  step_order: number;
  messages?: Message[];
};

export type Message = {
  id: string;
  step_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};
