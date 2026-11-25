/** Where a project sits in the catalogue: what is being built now, the work worth leading with, and the archive. */
export type ProjectTier = "current" | "selected" | "archive";

export interface Project {
    title: string;
    description: string;
    /** Where the project lives: its site, repository or write-up. Opens in a new tab. */
    link: string;
    /** The call to action for the current project's link. */
    linkLabel?: string;
    /** A stable id for the project. */
    slug: string;
    /** The year the project started. */
    year: number;
    tier: ProjectTier;
    /** A short recorded demo of the project. */
    demo?: string;
    /** A prize or recognition, as one line, and where it was announced. */
    award?: {
        text: string;
        href: string;
    };
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
        link: "https://www.stokemoney.com/#app",
        linkLabel: "Join the waitlist",
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
        link: "https://github.com/josephwibowo/cascade",
        slug: "cascade",
        miniature: {
            src: "office/assets/catalogue-cascade.v1.webp",
            alt: "A painted miniature of a tiered water cascade: channels fan out into many basins through small sluice gates, and a tiny figure stands at a closed gate",
        },
        year: 2026,
        tier: "selected",
        demo: "https://youtu.be/zLX3AQpTZR0",
        award: {
            text: "Winner · Astronomer’s Beyond the DAG hackathon, 2026",
            href: "https://www.astronomer.io/blog/beyond-the-dag-hackathon-meet-the-winners/",
        },
    },
    {
        title: "The Bus Factor",
        description: "An interactive exploration of the bus factor — how concentrated knowledge in a team becomes a single point of failure.",
        link: "https://josephwibowo.github.io/the-bus-factor/",
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
        link: "https://github.com/josephwibowo/mantora-mcp",
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
        link: "https://github.com/josephwibowo/CloudyCam",
        slug: "cloudycam",
        year: 2022,
        tier: "archive",
    },
    {
        title: "Predicting Closures",
        description: "Machine learning model to predict restaurant closures using movement trends and Yelp data during COVID-19.",
        link: "/reports/predicting-closures.pdf",
        slug: "predicting-closures",
        year: 2020,
        tier: "archive",
    },
    {
        title: "Meetup Analytics",
        description: "End-to-end analytics pipeline for Meetup.com data. ETL orchestration with Airflow and visualization with D3.js.",
        link: "https://github.com/josephwibowo/MeetBaeArea",
        slug: "meetup-analytics",
        year: 2018,
        tier: "archive",
    }
];
