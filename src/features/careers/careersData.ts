import {
  ChartNoAxesColumn,
  CodeXml,
  Plus,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

export const GREEN = "#01A17F";

export const FILTERS = ["All", "Data", "AI", "Web", "Security"] as const;
export type Filter = (typeof FILTERS)[number];

export type Career = {
  id: string;
  title: string;
  category: Exclude<Filter, "All">;
  /** Per year, e.g. "₹12-28 L". */
  salary: string;
  months: number;
  /** What the career teaches; the first is the one shown selected. */
  skills: readonly string[];
  Icon: LucideIcon;
  tint: string;
  color: string;
  /** The card on the careers page: its fill, border, salary colour and picture. */
  card: {
    bg: string;
    border: string;
    accent: string;
    image: string;
    /** The picture's size in px; it sits in the card's bottom-right corner. */
    box: { width: number; height: number };
  };
};

export const CAREERS: readonly Career[] = [
  {
    id: "data-scientist",
    title: "Data Scientist",
    category: "Data",
    salary: "₹12–28 L",
    months: 14,
    skills: ["Python", "SQL", "Statistics", "Pandas", "ML basics", "Visualisation", "Probability", "Feature work", "Modelling"],
    Icon: ChartNoAxesColumn,
    tint: "#E9F5F0",
    color: GREEN,
    card: {
      bg: "#FFF0E2",
      border: "#FFD1B3",
      accent: "#F57C2C",
      image: "/images/data-scientist.svg",
      box: { width: 79, height: 62 },
    },
  },
  {
    id: "software-engineer",
    title: "Software Engineer",
    category: "Web",
    salary: "₹8–30 L",
    months: 16,
    skills: ["Python", "Git", "Data structures", "Algorithms", "APIs", "Databases", "Testing", "System design", "Debugging", "CI/CD", "Cloud basics"],
    Icon: CodeXml,
    tint: "#E8F0FD",
    color: "#3683D3",
    card: {
      bg: "#EEF3FB",
      border: "#C7DEFD",
      accent: "#2F80ED",
      image: "/images/software-engineer.svg",
      box: { width: 71, height: 63 },
    },
  },
  {
    id: "data-analyst",
    title: "Data Analyst",
    category: "Data",
    salary: "₹6–14 L",
    months: 9,
    skills: ["Python", "SQL", "Excel", "Statistics", "Dashboards", "Visualisation", "Reporting"],
    Icon: ChartNoAxesColumn,
    tint: "#ECEAFD",
    color: "#5D4CFE",
    card: {
      bg: "#E8F8F4",
      border: "#D5F2EA",
      accent: "#007A70",
      image: "/images/data-analyst.svg",
      box: { width: 72, height: 62 },
    },
  },
  {
    id: "ai-engineer",
    title: "AI Engineer",
    category: "AI",
    salary: "₹15–40 L",
    months: 18,
    skills: ["Python", "Machine learning", "Deep learning", "NLP", "LLMs", "MLOps", "Math", "Prompting", "Evaluation", "Data pipelines", "Deployment", "Ethics"],
    Icon: Plus,
    tint: "#FFF0E5",
    color: "#FF8D42",
    card: {
      bg: "#FFF9ED",
      border: "#FDEBCB",
      accent: "#F5B301",
      image: "/images/ai-engineer.svg",
      box: { width: 75, height: 73 },
    },
  },
  {
    id: "web-developer",
    title: "Web Developer",
    category: "Web",
    salary: "₹5–18 L",
    months: 10,
    skills: ["Python", "HTML", "CSS", "JavaScript", "React", "APIs", "Git", "Deployment"],
    Icon: CodeXml,
    tint: "#E8F0FD",
    color: "#3683D3",
    card: {
      bg: "#FCF3F5",
      border: "#F6D7DD",
      accent: "#EA3D52",
      image: "/images/web-developer.svg",
      box: { width: 82, height: 65 },
    },
  },
  {
    id: "cybersecurity",
    title: "Cyber Security",
    category: "Security",
    salary: "₹8–30 L",
    months: 13,
    skills: ["Python", "Networking", "Linux", "Cryptography", "Threat modelling", "Pen testing", "Incident response", "Compliance", "Web security", "Scripting"],
    Icon: ShieldCheck,
    tint: "#FDE8E8",
    color: "#DC2626",
    card: {
      bg: "#F5F5FF",
      border: "#DBD5FE",
      accent: "#5D4CFE",
      image: "/images/cyber-security.svg",
      box: { width: 69, height: 62 },
    },
  },
];

export const careerById = (id: string) => CAREERS.find((career) => career.id === id);
