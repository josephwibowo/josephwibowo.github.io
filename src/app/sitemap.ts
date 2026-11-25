import { MetadataRoute } from 'next';
import { projects, type ProjectTier } from '@/data/projects';

export const dynamic = 'force-static';

/** Search engines get the same order of importance as the catalogue: what's being built, the selected work, then the archive. */
const PRIORITY: Record<ProjectTier, number> = { current: 0.9, selected: 0.8, archive: 0.5 };

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://josephwibowo.github.io';

    // Project pages (external projects have no detail page here)
    const projectRoutes = projects
        .filter((project) => !project.external)
        .map((project) => ({
            url: `${baseUrl}/projects/${project.slug}`,
            changeFrequency: 'monthly' as const,
            priority: PRIORITY[project.tier],
        }));

    return [
        { url: baseUrl, changeFrequency: 'monthly', priority: 1 },
        ...projectRoutes,
        { url: `${baseUrl}/projects/meetup-analytics/dashboard`, changeFrequency: 'yearly', priority: 0.3 },
    ];
}
