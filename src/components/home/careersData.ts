import {
  ChartNoAxesColumn,
  CodeXml,
  Plus,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

export const GREEN = "#01A17F";

export const FILTERS = ["All", "Data", "Web", "AI", "Security"] as const;
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
};

export const CAREERS: readonly Career[] = [
  {
    id: "data-scientist",
    title: "Data Scientist",
    category: "Data",
    salary: "₹12-28 L",
    months: 14,
    skills: ["Python", "SQL", "Statistics", "Pandas", "ML basics", "Visualisation", "Probability", "Feature work", "Modelling"],
    Icon: ChartNoAxesColumn,
    tint: "#E9F5F0",
    color: GREEN,
  },
  {
    id: "software-engineer",
    title: "Software Engineer",
    category: "Web",
    salary: "₹9-30 L",
    months: 16,
    skills: ["Python", "Git", "Data structures", "Algorithms", "APIs", "Databases", "Testing", "System design", "Debugging", "CI/CD", "Cloud basics"],
    Icon: CodeXml,
    tint: "#E8F0FD",
    color: "#3683D3",
  },
  {
    id: "data-analyst",
    title: "Data Analyst",
    category: "Data",
    salary: "₹6-14 L",
    months: 9,
    skills: ["Python", "SQL", "Excel", "Statistics", "Dashboards", "Visualisation", "Reporting"],
    Icon: ChartNoAxesColumn,
    tint: "#ECEAFD",
    color: "#5D4CFE",
  },
  {
    id: "ai-engineer",
    title: "AI Engineer",
    category: "AI",
    salary: "₹15-40 L",
    months: 18,
    skills: ["Python", "Machine learning", "Deep learning", "NLP", "LLMs", "MLOps", "Math", "Prompting", "Evaluation", "Data pipelines", "Deployment", "Ethics"],
    Icon: Plus,
    tint: "#FFF0E5",
    color: "#FF8D42",
  },
  {
    id: "web-developer",
    title: "Web Developer",
    category: "Web",
    salary: "₹5-18 L",
    months: 10,
    skills: ["Python", "HTML", "CSS", "JavaScript", "React", "APIs", "Git", "Deployment"],
    Icon: CodeXml,
    tint: "#E8F0FD",
    color: "#3683D3",
  },
  {
    id: "cybersecurity",
    title: "Cybersecurity",
    category: "Security",
    salary: "₹7-22 L",
    months: 13,
    skills: ["Python", "Networking", "Linux", "Cryptography", "Threat modelling", "Pen testing", "Incident response", "Compliance", "Web security", "Scripting"],
    Icon: ShieldCheck,
    tint: "#FDE8E8",
    color: "#DC2626",
  },
];

export const careerById = (id: string) => CAREERS.find((career) => career.id === id);
