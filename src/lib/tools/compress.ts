interface CompressionOptions {
    quality: 'low' | 'recommended' | 'extreme';
}

export const compressPdf = async (
    file: File,
    options: CompressionOptions,
    onProgress?: (progress: number) => void
): Promise<Blob> => {

    if (onProgress) onProgress(10);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('quality', options.quality);

    try {
        const response = await fetch('/api/compress', {
            method: 'POST',
            body: formData,
        });

        if (onProgress) onProgress(90);

        if (!response.ok) {
            // Try to read the error message from the server
            let errorMsg = "Unknown error";
            try {
                const data = await response.json();
                errorMsg = data.error || JSON.stringify(data);
            } catch (e) {
                // Ignore JSON parse error
            }

            throw new Error(errorMsg);
        }

        const blob = await response.blob();

        if (onProgress) onProgress(100);
        return blob;

    } catch (error: any) {
        console.error("Client Catch:", error);
        throw error;
    }
};