// This file now acts as a bridge to the API
interface ProtectionOptions {
    password: string;
    permissions?: {
        printing?: boolean;
        modifying?: boolean;
        copying?: boolean;
    };
}

export const protectPdf = async (
    file: File,
    options: ProtectionOptions,
    onProgress?: (progress: number) => void
): Promise<Blob> => {

    if (onProgress) onProgress(10); // Indicate start

    const formData = new FormData();
    formData.append('file', file);
    formData.append('password', options.password);
    formData.append('printing', String(options.permissions?.printing || false));
    formData.append('modifying', String(options.permissions?.modifying || false));

    if (onProgress) onProgress(30); // Indicate uploading

    try {
        const response = await fetch('/api/protect', {
            method: 'POST',
            body: formData,
        });

        if (onProgress) onProgress(90); // Indicate processing done

        if (!response.ok) {
            throw new Error('Encryption failed on server');
        }

        const blob = await response.blob();

        if (onProgress) onProgress(100);
        return blob;

    } catch (error) {
        console.error(error);
        throw error;
    }
};