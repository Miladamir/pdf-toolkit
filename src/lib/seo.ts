import { Metadata } from "next";

// --- Configuration ---
const SITE_NAME = "PDFToolkit";
// In production, set NEXT_PUBLIC_SITE_URL in your .env file
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://pdftoolkit.com";

// --- Metadata Generator (for <head>) ---

interface ToolMeta {
    title: string;
    description: string;
    path: string; // e.g., "/tools/merge"
}

export const generateToolMetadata = ({ title, description, path }: ToolMeta): Metadata => {
    return {
        title: `${title} - ${SITE_NAME}`,
        description: description,
        alternates: {
            canonical: `${BASE_URL}${path}`,
        },
        openGraph: {
            title: title,
            description: description,
            url: `${BASE_URL}${path}`,
            siteName: SITE_NAME,
            type: "website",
        },
        twitter: {
            card: "summary_large_image",
            title: title,
            description: description,
        },
    };
};

// --- Schema.org Generator (for JSON-LD) ---

interface ToolSchemaProps {
    name: string;
    description: string;
    path: string;
}

export const generateToolSchema = ({ name, description, path }: ToolSchemaProps) => {
    return {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": name,
        "description": description,
        "url": `${BASE_URL}${path}`,
        "applicationCategory": "UtilitiesApplication",
        "operatingSystem": "Any (Web Browser)",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD",
        },
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.8",
            "ratingCount": "1250",
        },
    };
};