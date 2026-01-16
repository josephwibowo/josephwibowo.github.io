export interface Project {
    title: string;
    description: string;
    tags: string[];
    link: string;
    image?: string;
    featured?: boolean;
    slug: string;
}

export const projects: Project[] = [
    {
        title: "Mantora",
        description: "A local-first MCP observer: lightweight UI + proxy for inspecting LLM data access with protective defaults. Sits between Claude/Cursor and target MCP servers.",
        tags: ["MCP", "LLM", "Python", "Security", "SQLite"],
        link: "https://github.com/josephwibowo/mantora-mcp",
        image: "/images/mantora_demo.gif",
        featured: true,
        slug: "mantora",
    },
    {
        title: "SOJI",
        description: "Multi-tenant SaaS application for Etsy Inventory Management. Built with React and Python.",
        tags: ["SaaS", "Python", "React", "AWS"],
        link: "https://sojiapp.com",
        image: "/images/soji.png",
        slug: "soji",
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
