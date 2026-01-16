import fs from "fs";
import path from "path";
import matter from "gray-matter";
import ReactMarkdown from "react-markdown";
import Link from "next/link";
import { ArrowLeft, Github, Globe } from "lucide-react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { projects } from "@/data/projects";

interface ProjectPageProps {
    params: Promise<{
        slug: string;
    }>;
}

export async function generateStaticParams() {
    return projects.map((project) => ({
        slug: project.slug,
    }));
}

export default async function ProjectPage({ params }: ProjectPageProps) {
    const { slug } = await params;

    // Find project metadata
    const project = projects.find((p) => p.slug === slug);
    if (!project) notFound();

    // Read markdown file
    const filePath = path.join(process.cwd(), "src/content/projects", `${slug}.md`);
    let content = "";

    try {
        const fileContent = fs.readFileSync(filePath, "utf-8");
        const { content: markdown } = matter(fileContent);
        content = markdown;
    } catch (error) {
        // If file doesn't exist, we fallback to description or empty
        content = project.description;
    }

    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground font-sans">
            <main className="container mx-auto px-6 py-12 max-w-4xl">
                <Link href="/" className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors mb-8 group">
                    <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                    Back to Projects
                </Link>

                <header className="mb-12">
                    <div className="flex flex-wrap gap-2 mb-6">
                        {project.tags.map((tag) => (
                            <span key={tag} className="px-3 py-1 text-sm font-mono rounded-full bg-secondary text-secondary-foreground">
                                {tag}
                            </span>
                        ))}
                    </div>
                    <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">{project.title}</h1>

                    <div className="flex gap-4">
                        {project.link !== "#" && (
                            <a
                                href={project.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
                            >
                                <Globe className="w-4 h-4" />
                                Visit Project
                            </a>
                        )}
                        {/* Assuming mostly GitHub links, generic fallback for now */}
                    </div>
                </header>

                {project.image && (
                    <div className="relative w-full h-[400px] md:h-[500px] mb-12 rounded-3xl overflow-hidden border border-border/50 bg-card">
                        <Image
                            src={project.image}
                            alt={project.title}
                            fill
                            className="object-cover"
                            priority
                        />
                    </div>
                )}

                <article className="prose prose-invert prose-lg max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-p:text-muted-foreground prose-a:text-primary hover:prose-a:text-primary/80 prose-code:text-primary prose-code:bg-secondary/50 prose-code:px-1 prose-code:rounded prose-code:before:content-none prose-code:after:content-none">
                    <ReactMarkdown>{content}</ReactMarkdown>
                </article>
            </main>
        </div>
    );
}
