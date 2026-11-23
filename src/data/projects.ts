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
    featured?: boolean;
    external?: boolean;
    slug: string;
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
        featured: true,
        slug: "stoke",
    },
    {
        title: "The Bus Factor",
        description: "An interactive exploration of the bus factor — how concentrated knowledge in a team becomes a single point of failure.",
        tags: ["Interactive", "Essay"],
        link: "https://josephwibowo.github.io/the-bus-factor/",
        image: "/images/the-bus-factor.png",
        external: true,
        slug: "the-bus-factor",
    },
    {
        title: "Mantora",
        description: "A local-first MCP observer: lightweight UI + proxy for inspecting LLM data access with protective defaults. Sits between Claude/Cursor and target MCP servers.",
        tags: ["MCP", "LLM", "Python", "Security", "SQLite"],
        link: "https://github.com/josephwibowo/mantora-mcp",
        image: "/images/mantora_demo.gif",
        slug: "mantora",
    },
    {
        title: "CloudyCam",
        description: "A Nest camera recorder built in Python. Uses WebSockets to capture and stream video feeds.",
        tags: ["Python", "WebSockets", "Streaming", "FFmpeg"],
        link: "https://github.com/josephwibowo/CloudyCam",
        image: "/images/cloudycam.gif",
        slug: "cloudycam",
    },
    {
        title: "Predicting Closures",
        description: "Machine learning model to predict restaurant closures using movement trends and Yelp data during COVID-19.",
        tags: ["Machine Learning", "Python", "D3.js", "Data Science"],
        link: "#",
        image: "/images/poster.jpg",
        slug: "predicting-closures",
    },
    {
        title: "Meetup Analytics",
        description: "End-to-end analytics pipeline for Meetup.com data. ETL orchestration with Airflow and visualization with D3.js.",
        tags: ["Airflow", "ETL", "Python", "D3.js", "Docker"],
        link: "/projects/meetup-analytics/dashboard",
        image: "/images/dashboard-min.gif",
        slug: "meetup-analytics",
    }
];
