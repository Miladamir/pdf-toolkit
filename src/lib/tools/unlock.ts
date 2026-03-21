interface UnlockOptions {
    password: string;
}

export const unlockPdf = async (
    file: File,
    options: UnlockOptions
): Promise<Blob> => {

    const formData = new FormData();
    formData.append('file', file);
    formData.append('password', options.password);

    const response = await fetch('/api/unlock', {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        // Fix: Cast the JSON result to the expected type
        const errorData = await response.json() as { error?: string };
        throw new Error(errorData.error || 'Failed to unlock PDF');
    }

    return await response.blob();
};