/**
 * Parses a string like "1-3, 5" into an array of 0-based indices.
 * Example: "1-3, 5" => [0, 1, 2, 4]
 */
export const parsePageRanges = (input: string, maxPages: number): number[] => {
    if (input.toLowerCase() === 'all' || input.trim() === '') {
        return Array.from({ length: maxPages }, (_, i) => i);
    }

    const indices = new Set<number>();
    const parts = input.split(',');

    parts.forEach(part => {
        const trimmed = part.trim();
        if (trimmed.includes('-')) {
            const [start, end] = trimmed.split('-').map(Number);
            if (!isNaN(start) && !isNaN(end)) {
                for (let i = start; i <= end; i++) {
                    if (i > 0 && i <= maxPages) indices.add(i - 1);
                }
            }
        } else {
            const pageNum = parseInt(trimmed, 10);
            if (!isNaN(pageNum) && pageNum > 0 && pageNum <= maxPages) {
                indices.add(pageNum - 1);
            }
        }
    });

    return Array.from(indices).sort((a, b) => a - b);
};

/**
 * Validates a file for size and type.
 */
export const validateFile = (
    file: File,
    maxSizeMB: number = 50,
    acceptTypes: string = ".pdf"
): { valid: boolean; error?: string } => {

    // 1. Check Size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
        return {
            valid: false,
            error: `File size exceeds ${maxSizeMB}MB limit.`
        };
    }

    // 2. Check Type
    const fileType = file.type;
    const fileName = file.name.toLowerCase();
    const acceptedList = acceptTypes.split(',').map(t => t.trim().toLowerCase());

    let isAccepted = false;

    for (const type of acceptedList) {
        // Handle Wildcards (e.g., "image/*")
        if (type.endsWith('/*')) {
            const category = type.replace('/*', '');
            if (fileType.startsWith(category)) {
                isAccepted = true;
                break;
            }
        }
        // Handle Extensions (e.g., ".pdf")
        else if (type.startsWith('.')) {
            if (fileName.endsWith(type)) {
                isAccepted = true;
                break;
            }
        }
        // Handle MIME types (e.g., "image/png")
        else {
            if (fileType === type) {
                isAccepted = true;
                break;
            }
        }
    }

    if (!isAccepted) {
        return {
            valid: false,
            error: `Invalid file type. Allowed: ${acceptTypes}`
        };
    }

    return { valid: true };
};

/**
 * Triggers a browser download for a given Blob or File object.
 * Creates a temporary object URL, clicks a hidden link, and cleans up.
 */
export const downloadBlob = (blob: Blob | File, filename: string) => {
    // Create a temporary URL for the blob
    const url = URL.createObjectURL(blob);

    // Create an invisible anchor element
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;

    // Append to body (required for Firefox)
    document.body.appendChild(a);

    // Trigger the download
    a.click();

    // Clean up: remove element and revoke URL
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};