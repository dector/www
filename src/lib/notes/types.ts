export type PostChange = {
  hash: string;
  date: string;
  displayDate: string;
  message: string;
};

export type PostHistory = {
  createdAt: string;
  updatedAt: string;
  currentVersion: string;
  changes: PostChange[];
};

export type Post = {
  slug: string;
  title: string;
  createdAt: string;
  updatedAt: string | null;
  displayDate: string;
  revision: number | string | null;
  isPublic: boolean;
  tags: string[];
  pinned: number;
  html: string;
  history: PostHistory | null;
};

export type TagPage = {
  tag: string;
  posts: Pick<Post, "slug" | "title" | "pinned">[];
};
