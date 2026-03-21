import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pdftoolkit.com";

    // List of all tools
    const tools = [
        'merge',
        'split',
        'delete',
        'organize',
        'pdf-to-image',
        'image-to-pdf',
        'watermark',
        'page-numbers',
        'grayscale',
        'sign',
        'edit',
    ];

    const toolUrls = tools.map(tool => ({
        url: `${baseUrl}/tools/${tool}`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.8,
    }));

    return [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 1,
        },
        ...toolUrls,
    ];
}