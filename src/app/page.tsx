"use client";

import { motion } from "framer-motion";
import { projects } from "@/data/projects";
import { ArrowUpRight, Github, Linkedin, Mail } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      <main className="container mx-auto px-6 py-24 max-w-5xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold font-sans tracking-tight mb-2">
              Joseph Wibowo
            </h1>
            <p className="text-muted-foreground text-lg md:text-xl font-mono">
              Engineering Data Platforms. (Powered by Spec-Driven Vibing)
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex gap-4"
          >
            <SocialLink href="https://github.com/josephwibowo" icon={<Github className="w-5 h-5" />} />
            <SocialLink href="https://linkedin.com/in/josephwibowo" icon={<Linkedin className="w-5 h-5" />} />
            <SocialLink href="mailto:josephwibowo@gmail.com" icon={<Mail className="w-5 h-5" />} />
          </motion.div>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 auto-rows-[300px]">
          {projects.map((project, index) => (
            <ProjectCard key={project.title} project={project} index={index} />
          ))}
        </div>
      </main>
    </div>
  );
}

function SocialLink({ href, icon }: { href: string; icon: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="p-3 rounded-full bg-secondary hover:bg-secondary/80 transition-colors text-secondary-foreground hover:text-primary"
    >
      {icon}
    </Link>
  );
}

function ProjectCard({ project, index }: { project: any; index: number }) {
  // Bento Span Logic
  const isFeatured = project.featured;
  const spanClass = isFeatured ? "md:col-span-2 md:row-span-1" : "col-span-1";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className={cn(
        "group relative overflow-hidden rounded-3xl bg-card border border-border/50 hover:border-primary/50 transition-colors h-full flex flex-col",
        spanClass
      )}
    >
      {/* Hover Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-0" />

      {/* Content Container - Pushed to top */}
      <div className="flex flex-col p-6 z-20 relative h-full">
        <div className="flex justify-between items-start mb-4">
          <div className="flex flex-wrap gap-2 max-w-[80%]">
            {project.tags.map((tag: string) => (
              <span key={tag} className="px-2 py-1 text-xs font-mono font-medium rounded-md bg-secondary/50 text-muted-foreground border border-transparent group-hover:border-primary/20 backdrop-blur-sm">
                {tag}
              </span>
            ))}
          </div>
          <Link
            href={project.external ? project.link : `/projects/${project.slug}`}
            {...(project.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className="p-2 rounded-full bg-background/80 hover:bg-primary hover:text-white transition-colors"
          >
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        <div>
          <Link
            href={project.external ? project.link : `/projects/${project.slug}`}
            {...(project.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className="block group-hover:text-primary transition-colors font-sans"
          >
            <h3 className="text-2xl font-bold mb-2">{project.title}</h3>
          </Link>
          <p className="text-muted-foreground leading-relaxed text-sm md:text-base line-clamp-3 max-w-[90%]">
            {project.description}
          </p>
        </div>
      </div>

      {/* Image Background/Peek - Pushed to bottom */}
      {project.image && (
        <div
          className="absolute bottom-0 left-0 right-0 h-1/2 opacity-30 group-hover:opacity-70 transition-all duration-500 z-10 pointer-events-none translate-y-4 group-hover:translate-y-0"
          style={{
            maskImage: "linear-gradient(to top, black 10%, transparent 90%)",
            WebkitMaskImage: "linear-gradient(to top, black 10%, transparent 90%)"
          }}
        >
          <Image
            src={project.image}
            alt={project.title}
            fill
            className="object-cover object-top"
          />
        </div>
      )}
    </motion.div>
  );
}
