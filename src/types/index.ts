// We extend the default File type to add a unique ID and preview URL
export interface ProcessableFile {
    id: string;
    file: File;
    previewUrl?: string; // We will use this later for thumbnails
    pageCount?: number;  // We will use this later for PDF info
}