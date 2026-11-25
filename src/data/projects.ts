/** Where a project sits in the catalogue: what is being built now, the work worth leading with, and the archive. */
export type ProjectTier = "current" | "selected" | "archive";

export interface Project {
    title: string;
    description: string;
    tags: string[];
    link: string;
    linkLabel?: string;
    image?: string | {
        src: string;
        alt: string;
        width: number;
        height: number;
    };
    external?: boolean;
    slug: string;
    /** The year the project started. */
    year: number;
    tier: ProjectTier;
    /** A short recorded demo of the project. */
    demo?: string;
    /** A prize or recognition, as one line. */
    award?: string;
    /**
     * The painted miniature the home page's catalogue shows for this project. `src` is relative to the site root
     * (no leading slash), because the home page loads it relative to itself and so works under any base path.
     */
    miniature?: {
        src: string;
        alt: string;
    };
}

export const projects: Project[] = [
    {
        title: "Stoke Money",
        description: "A personal finance app for seeing where your money went, what changed, and which bills are coming up.",
        tags: ["Personal Finance", "iOS"],
        link: "https://www.stokemoney.com/#app",
        linkLabel: "Join the waitlist",
        image: {
            src: "/images/stoke-money-preview.jpg",
            alt: "Stoke Money’s sample transaction ledger with its illustrated companion and row punch",
            width: 1200,
            height: 630,
        },
        slug: "stoke",
        miniature: {
            src: "office/assets/catalogue-stoke-greenhouse.v1.webp",
            alt: "A painted miniature of a small balsa greenhouse glowing from inside, on a wooden plinth",
        },
        year: 2026,
        tier: "current",
    },
    {
        title: "Cascade",
        description: "An Airflow plugin that runs an API deprecation as a program: one mapped task per account, human-in-the-loop exceptions, and migrations verified by telemetry.",
        tags: ["Airflow", "Python", "React", "LLM"],
        link: "https://github.com/josephwibowo/cascade",
        external: true,
        slug: "cascade",
        miniature: {
            src: "office/assets/catalogue-cascade.v1.webp",
            alt: "A painted miniature of a tiered water cascade: channels fan out into many basins through small sluice gates, and a tiny figure stands at a closed gate",
        },
        year: 2026,
        tier: "selected",
        demo: "https://youtu.be/zLX3AQpTZR0",
        award: "Winner · Astronomer’s Beyond the DAG hackathon, 2026",
    },
    {
        title: "The Bus Factor",
        description: "An interactive exploration of the bus factor — how concentrated knowledge in a team becomes a single point of failure.",
        tags: ["Interactive", "Essay"],
        link: "https://josephwibowo.github.io/the-bus-factor/",
        image: "/images/the-bus-factor.png",
        external: true,
        slug: "the-bus-factor",
        miniature: {
            src: "office/assets/catalogue-bus-factor.v1.webp",
            alt: "A painted miniature of a city bus at a stop, with a few tiny figures waiting beside it",
        },
        year: 2026,
        tier: "selected",
    },
    {
        title: "Mantora",
        description: "A local-first MCP observer: lightweight UI + proxy for inspecting LLM data access with protective defaults. Sits between Claude/Cursor and target MCP servers.",
        tags: ["MCP", "LLM", "Python", "Security", "SQLite"],
        link: "https://github.com/josephwibowo/mantora-mcp",
        image: "/images/mantora_demo.gif",
        slug: "mantora",
        miniature: {
            src: "office/assets/catalogue-mantora.v1.webp",
            alt: "A painted miniature of a glass observation booth, with a tiny figure watching a monitor inside",
        },
        year: 2026,
        tier: "selected",
    },
    {
        title: "CloudyCam",
        description: "A Nest camera recorder built in Python. Uses WebSockets to capture and stream video feeds.",
        tags: ["Python", "WebSockets", "Streaming", "FFmpeg"],
        link: "https://github.com/josephwibowo/CloudyCam",
        image: "/images/cloudycam.gif",
        slug: "cloudycam",
        year: 2022,
        tier: "archive",
    },
    {
        title: "Predicting Closures",
        description: "Machine learning model to predict restaurant closures using movement trends and Yelp data during COVID-19.",
        tags: ["Machine Learning", "Python", "D3.js", "Data Science"],
        link: "#",
        image: "/images/poster.jpg",
        slug: "predicting-closures",
        year: 2020,
        tier: "archive",
    },
    {
        title: "Meetup Analytics",
        description: "End-to-end analytics pipeline for Meetup.com data. ETL orchestration with Airflow and visualization with D3.js.",
        tags: ["Airflow", "ETL", "Python", "D3.js", "Docker"],
        link: "/projects/meetup-analytics/dashboard",
        image: "/images/dashboard-min.gif",
        slug: "meetup-analytics",
        year: 2018,
        tier: "archive",
    }
];
