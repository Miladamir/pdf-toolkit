"use client";

import Script from "next/script";

interface JsonLdProps {
    data: object;
}

export const JsonLd: React.FC<JsonLdProps> = ({ data }) => {
    return (
        <Script
            id="json-ld"
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
        />
    );
};