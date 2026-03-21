// src/types/cloudflare.d.ts

import '@opennextjs/cloudflare';

declare module '@opennextjs/cloudflare' {
    // Extend the CloudflareEnv interface to include your R2 bucket
    interface CloudflareEnv {
        BUCKET: R2Bucket;
    }
}