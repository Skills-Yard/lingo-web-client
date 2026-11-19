import type { LucideIcon } from "lucide-react";
import { CodeXml, FileText, Image as ImageIcon, Lightbulb } from "lucide-react";

export type StoryRing = { id: string; letter: string; name: string; color: string };

export const STORIES: readonly StoryRing[] = [
  { id: "you", letter: "Y", name: "You", color: "#D0D5DD" },
  { id: "lingo", letter: "L", name: "Lingo", color: "#01A17F" },
  { id: "data-sci", letter: "D", name: "Data Sci", color: "#5D4CFE" },
  { id: "maya", letter: "M", name: "Maya", color: "#FF8D42" },
  { id: "dev", letter: "D", name: "Dev", color: "#2F80ED" },
];

/** What fills the post's picture: the video glyph is an image file, the rest
 * are icons. */
export type PostMedia =
  | { kind: "video"; tint: string }
  | { kind: "image"; src: string }
  | { kind: "icon"; Icon: LucideIcon; tint: string; color: string };

export type Post = {
  type: "post";
  id: string;
  author: string;
  avatar: string;
  media: PostMedia;
  caption: string;
  likes: string;
  comments: number;
};

export type PollOption = { label: string; /** Votes cast before the learner's. */ votes: number };

export type Poll = {
  type: "poll";
  id: string;
  question: string;
  options: readonly PollOption[];
};

export type FeedItem = Post | Poll;

const VIDEO_TINT = "#E5EFFD";

export const FEED: readonly FeedItem[] = [
  {
    type: "post",
    id: "netflix-reel",
    author: "Data Scientist · official",
    avatar: "#01A17F",
    media: { kind: "image", src: "/images/netflix.png" },
    caption: "How Netflix uses Python to recommend shows",
    likes: "1.2k",
    comments: 84,
  },
  {
    type: "poll",
    id: "poll-print",
    question: "Quick poll · Which runs first?",
    options: [
      { label: "print(1) then print(2)", votes: 412 },
      { label: "Both at the same time", votes: 37 },
    ],
  },
  {
    type: "post",
    id: "grid-vs-flex",
    author: "Web Developer · official",
    avatar: "#3683D3",
    media: { kind: "icon", Icon: FileText, tint: "#FFF3E0", color: "#F2994A" },
    caption: "Article · CSS grid vs flexbox: when to reach for which (5 min read)",
    likes: "864",
    comments: 52,
  },
  {
    type: "post",
    id: "streak-tip",
    author: "Lingo · official",
    avatar: "#FF8D42",
    media: { kind: "icon", Icon: Lightbulb, tint: "#FFF8DB", color: "#E0A400" },
    caption: "Tip · Ten minutes a day beats a three-hour weekend. Keep the streak alive.",
    likes: "2.4k",
    comments: 131,
  },
  {
    type: "post",
    id: "chatbot-reel",
    author: "AI Engineer · official",
    avatar: "#5D4CFE",
    media: { kind: "video", tint: "#EDEAFD" },
    caption: "Reel · How a chatbot “understands” you, in three steps (45 s)",
    likes: "3.1k",
    comments: 207,
  },
  {
    type: "poll",
    id: "poll-len",
    question: "Quick poll · What does len(\"hello\") return?",
    options: [
      { label: "4", votes: 58 },
      { label: "5", votes: 603 },
      { label: "It raises an error", votes: 21 },
    ],
  },
  {
    type: "post",
    id: "password-managers",
    author: "Cybersecurity · official",
    avatar: "#DC2626",
    media: { kind: "icon", Icon: FileText, tint: "#FDE8E8", color: "#DC2626" },
    caption: "Explainer · Why a password manager beats a “clever” password (4 min read)",
    likes: "947",
    comments: 63,
  },
  {
    type: "post",
    id: "pandas-groupby",
    author: "Data Analyst · official",
    avatar: "#2F80ED",
    media: { kind: "video", tint: VIDEO_TINT },
    caption: "Reel · Pandas in one minute: groupby, explained (60 s)",
    likes: "1.8k",
    comments: 96,
  },
  {
    type: "post",
    id: "maya-habit-tracker",
    author: "Maya",
    avatar: "#FF8D42",
    media: { kind: "icon", Icon: ImageIcon, tint: "#F3E8FF", color: "#9B51E0" },
    caption: "Shipped my first Python script today — a tiny habit tracker. Feedback welcome!",
    likes: "412",
    comments: 38,
  },
  {
    type: "post",
    id: "git-branching",
    author: "Software Engineer · official",
    avatar: "#01A17F",
    media: { kind: "icon", Icon: CodeXml, tint: "#E9F5F0", color: "#01A17F" },
    caption: "Article · Git branching without the headaches (6 min read)",
    likes: "1.1k",
    comments: 71,
  },
];
