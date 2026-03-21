/// <reference types="@cloudflare/workers-types" />

// Extend the Cloudflare Env interface to include your bindings
declare global {
    interface CloudflareEnv extends Env {
        // No need to redefine PDF_BUCKET here, 'Env' from workers-types 
        // often covers R2Bucket if wrangler.toml is correct, 
        // but we keep CloudflareEnv as our custom alias.
        PDF_BUCKET: R2Bucket;
    }

    // Allow usage via process.env or getRequestContext
    namespace NodeJS {
        interface ProcessEnv extends CloudflareEnv { }
    }
}

export { };