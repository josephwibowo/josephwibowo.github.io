import { MetadataRoute } from 'next';

export const dynamic = 'force-static';

/** The site is one page: projects link out to their own repositories and write-ups. */
export default function sitemap(): MetadataRoute.Sitemap {
    return [{ url: 'https://josephwibowo.github.io', changeFrequency: 'monthly', priority: 1 }];
}
