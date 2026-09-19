export type Task = {
  id: string;
  title: string;
  createdAt: string;
  dueDate: string | null;
  completedAt: string | null;
  note: string | null;
  steps: Step[];
};

export type Step = {
  id: string;
  text: string;
  depth: number;
  completedAt: string | null;
};
