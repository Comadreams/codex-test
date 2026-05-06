export const STATUSES = ["Ideas", "Drafting", "In Progress", "Needs Review", "Done"] as const;

export type CardStatus = (typeof STATUSES)[number];

export type Comment = {
  id: string;
  author: string;
  text: string;
  createdAt: string;
};

export type StoryCard = {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: CardStatus;
  tags: string[];
  imageUrl?: string;
  attachmentUrl?: string;
  comments: Comment[];
  updatedBy: string;
  updatedAt: string;
};

export type Project = {
  id: string;
  name: string;
  createdAt: string;
};

export type DreamzState = {
  projects: Project[];
  cards: StoryCard[];
};
