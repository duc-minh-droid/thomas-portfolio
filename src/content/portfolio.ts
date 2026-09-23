// Single source of truth for everything that isn't a GitHub project.
// Where CV and LinkedIn disagreed, LinkedIn values are used.

export const profile = {
  name: "Thomas Nguyen",
  first: "Thomas",
  role: "AI Engineer",
  tagline: "I get AI agents to do real work, then spend my evenings building stuff nobody asked for.",
  headline: "CS student at Exeter · AI intern at Zayo · ex-Sophos",
  location: "London, UK",
  email: "ducminhcsp@gmail.com",
  cv: "/Thomas_Nguyen_CV.pdf",
  stickers: ["4× hackathon winner", "quant dev one day"],
  socials: [
    { label: "GitHub", handle: "duc-minh-droid", href: "https://github.com/duc-minh-droid", icon: "github" },
    { label: "LinkedIn", handle: "thomas-nguyen05", href: "https://www.linkedin.com/in/thomas-nguyen05/", icon: "linkedin" },
    { label: "X", handle: "@thomas_devmd", href: "https://x.com/thomas_devmd", icon: "x" },
  ],
};

export type Job = {
  company: string;
  role: string;
  start: string;
  end: string;
  location: string;
  note: string;
  doodle: string;
  color: string;
  points: { text: string; mark?: string }[];
};

export const jobs: Job[] = [
  {
    company: "Zayo Europe",
    role: "AI Specialist Intern",
    start: "Jul 2026",
    end: "Sep 2026",
    location: "London",
    note: "agents talking to Salesforce!",
    doodle: "nodes",
    color: "var(--coral)",
    points: [
      { text: "Built a Python + LLM pipeline that sorts, OCRs, parses and chunks messy documents, then lets a few agents pull the data out. It chewed through 10K+ files in 20+ formats and made data prep about 10x faster.", mark: "about 10x" },
      { text: "Built the agent system 12+ teams now use to automate their work. RAG, long-term memory, subagents, and MCP tools so it can actually get things done in Salesforce, Excel and Power BI.", mark: "12+ teams" },
    ],
  },
  {
    company: "Sophos",
    role: "Software Engineer Intern",
    start: "Jul 2025",
    end: "Jul 2026",
    location: "Oxford",
    note: "a whole year of shipping",
    doodle: "shield",
    color: "var(--teal)",
    points: [
      { text: "Kept 10+ Java/Spring Boot microservices happy, pushed test coverage to 85%, and added JWT auth that closed 3 session vulnerabilities.", mark: "85%" },
      { text: "Shipped TypeScript/Angular features 200+ people use every day, plus the REST APIs behind them (6+ other services call those).", mark: "200+" },
      { text: "Babysat AWS (EC2, S3) and the CI/CD pipelines with Docker, Gradle and Terraform. Deploys got 32% faster.", mark: "32%" },
    ],
  },
  {
    company: "Fremantle",
    role: "Artificial Intelligence Intern",
    start: "Jul 2024",
    end: "Sep 2024",
    location: "London",
    note: "first taste of prod AI",
    doodle: "clapper",
    color: "var(--blue)",
    points: [
      { text: "Fine-tuned a speech-to-text model in PyTorch and TensorFlow until it hit 98% accuracy, then built a UI so people could actually use it.", mark: "98%" },
      { text: "Built pipelines in Python, Excel and Power BI to pull and crunch data. Decisions made with it got 25% better.", mark: "25%" },
      { text: "Automated the repetitive stuff with Power Automate and ChatGPT Enterprise. Productivity up 30%, costs down 10%.", mark: "30%" },
    ],
  },
];

export type Club = {
  name: string;
  org: string;
  role: string;
  start: string;
  end: string;
  text: string;
  color: string;
  doodle: string;
};

export const clubs: Club[] = [
  {
    name: "ExeAI",
    org: "University of Exeter",
    role: "Co-Founder",
    start: "Sep 2024",
    end: "Mar 2025",
    text: "Started ML workshops with the Google Developer Student Club. Eight of us ran it, and 100+ students turned up to learn neural nets and supervised learning.",
    color: "var(--note-yellow)",
    doodle: "brain",
  },
  {
    name: "ExeCode",
    org: "Exeter Entrepreneurs Society",
    role: "Workshop Leader",
    start: "Sep 2024",
    end: "Dec 2024",
    text: "Taught Python to 700+ people who'd never written a line of code, and kept the MERN site tracking their progress alive.",
    color: "var(--note-blue)",
    doodle: "code",
  },
  {
    name: "QuantFin Society",
    org: "University of Exeter",
    role: "Quantitative Research",
    start: "Sep 2025",
    end: "Mar 2026",
    text: "Did quant research with the uni's finance society. Very on brand for a future quant dev.",
    color: "var(--note-green)",
    doodle: "chart",
  },
  {
    name: "LeadGreen",
    org: "Exeter",
    role: "Co-Founder",
    start: "Feb 2025",
    end: "Jul 2025",
    text: "Co-founded LeadGreen. Ask me about it.",
    color: "var(--note-pink)",
    doodle: "plant",
  },
];

export const education = [
  {
    school: "University of Exeter",
    course: "BSc Computer Science",
    start: "2023",
    end: "2027",
    grade: "First class (expected)",
    stamp: "FIRST",
    detail: "ML · Data Structures & Algorithms · Operating Systems · HPC · Databases",
  },
  {
    school: "INTO University of Exeter",
    course: "Foundation year, Computer Science",
    start: "2022",
    end: "2023",
    grade: "1st class with Distinction, plus a £5,000 scholarship",
    stamp: "1ST",
    detail: "Maths & Statistics · Economics & Finance",
  },
];

// icon: a simple-icons key (without "si") or `doodle:<name>` for things with no logo.
export type Skill = { name: string; icon: string; color?: string };
export type SkillGroup = { title: string; color: string; skills: Skill[] };

export const skillGroups: SkillGroup[] = [
  {
    title: "Languages",
    color: "var(--blue)",
    skills: [
      { name: "Python", icon: "Python" },
      { name: "TypeScript", icon: "Typescript" },
      { name: "JavaScript", icon: "Javascript" },
      { name: "Java", icon: "Openjdk", color: "#E76F00" },
      { name: "C++", icon: "Cplusplus" },
      { name: "Rust", icon: "Rust", color: "#CE422B" },
      { name: "Go", icon: "Go" },
      { name: "SQL", icon: "doodle:database" },
    ],
  },
  {
    title: "AI / LLMs",
    color: "var(--coral)",
    skills: [
      { name: "PyTorch", icon: "Pytorch" },
      { name: "TensorFlow", icon: "Tensorflow" },
      { name: "Claude API", icon: "Claude" },
      { name: "MCP", icon: "Modelcontextprotocol" },
      { name: "RAG", icon: "doodle:book" },
      { name: "Multi-agent", icon: "doodle:nodes" },
      { name: "OCR", icon: "doodle:eye" },
      { name: "Qwen (local)", icon: "Qwen" },
      { name: "Hugging Face", icon: "Huggingface" },
      { name: "Copilot Studio", icon: "Githubcopilot" },
    ],
  },
  {
    title: "Frontend",
    color: "var(--teal)",
    skills: [
      { name: "React", icon: "React" },
      { name: "Angular", icon: "Angular", color: "#DD0031" },
      { name: "Three.js / R3F", icon: "Threedotjs" },
      { name: "Tailwind", icon: "Tailwindcss" },
      { name: "WebAssembly", icon: "Webassembly" },
      { name: "Chrome ext.", icon: "Googlechrome" },
    ],
  },
  {
    title: "Backend",
    color: "var(--purple)",
    skills: [
      { name: "Spring Boot", icon: "Springboot" },
      { name: "Node.js", icon: "Nodedotjs" },
      { name: "Express", icon: "Express" },
      { name: "REST APIs", icon: "doodle:arrows" },
      { name: "WebSockets", icon: "doodle:bolt" },
      { name: "Tokio", icon: "Tokio" },
      { name: "JWT", icon: "Jsonwebtokens" },
    ],
  },
  {
    title: "Data",
    color: "var(--mustard)",
    skills: [
      { name: "SQLite", icon: "Sqlite" },
      { name: "MongoDB", icon: "Mongodb" },
      { name: "Power BI", icon: "doodle:chart" },
      { name: "Excel", icon: "doodle:grid" },
      { name: "Salesforce", icon: "doodle:cloud" },
    ],
  },
  {
    title: "Cloud / DevOps",
    color: "var(--blue)",
    skills: [
      { name: "AWS", icon: "doodle:cloud" },
      { name: "Docker", icon: "Docker" },
      { name: "Terraform", icon: "Terraform" },
      { name: "Gradle", icon: "Gradle" },
      { name: "CI/CD", icon: "Githubactions" },
      { name: "Vercel", icon: "Vercel" },
    ],
  },
  {
    title: "Automation",
    color: "var(--coral)",
    skills: [
      { name: "Playwright", icon: "doodle:theater" },
      { name: "Power Automate", icon: "doodle:flow" },
    ],
  },
];

// Handwritten margin note beside each project on the timeline.
export const projectNotes: Record<string, string> = {
  neurocraft: "type it, see it",
  "hollow-hand": "the dealer learns you",
  jevbrowser: "never hits submit",
  jevis: "reads the UI, not pixels",
  backlot: "fits in 8GB of VRAM",
  leetgraph: "LeetCode, but a roguelike",
  dogin: "auth, by hand",
  boogle: "shows its maths",
  discorb: "rooms survive restarts",
  zippy: "abracadabra → bits",
  stuff3d: "~300 lines of C++",
  MLFQScheduler: "tick by tick",
  MemoryManagement: "byte by byte",
  OrderBook: "price-time priority",
  JsonParser: "watch it parse",
};

// Margin doodle per project (falls back to "star").
export const projectDoodles: Record<string, string> = {
  neurocraft: "castle",
  "hollow-hand": "card",
  jevbrowser: "cursor",
  jevis: "mic",
  backlot: "camera",
  leetgraph: "flag",
  dogin: "lock",
  boogle: "magnifier",
  discorb: "chat",
  zippy: "zip",
  stuff3d: "cube",
  MLFQScheduler: "clock",
  MemoryManagement: "blocks",
  OrderBook: "candles",
  JsonParser: "braces",
};
