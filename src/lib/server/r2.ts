// No need to import CloudflareEnv if defined globally in env.d.ts

export const R2_HELPERS = {
    // Upload a file to R2
    async upload(env: CloudflareEnv, key: string, body: ReadableStream | ArrayBuffer | Blob) {
        return await env.PDF_BUCKET.put(key, body);
    },

    // Download a file from R2
    async get(env: CloudflareEnv, key: string) {
        return await env.PDF_BUCKET.get(key);
    },

    // Delete a file from R2
    async delete(env: CloudflareEnv, key: string) {
        return await env.PDF_BUCKET.delete(key);
    }
};