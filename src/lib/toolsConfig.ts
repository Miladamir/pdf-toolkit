export interface ToolConfig {
    id: string;
    name: string;
    description: string;
    longDescription: string;
    path: string;
    icon: string; // SVG Path data (d attribute)
    iconType?: 'stroke' | 'fill'; // To distinguish between outline and solid icons
    category: "organize" | "convert" | "edit";
}

export const allTools: ToolConfig[] = [
    {
        id: "merge",
        name: "Merge PDF",
        description: "Combine multiple PDF files into a single document.",
        longDescription: "Easily merge multiple PDF files into one. Reorder pages and combine documents in seconds. 100% free and secure.",
        path: "/tools/merge",
        // Icon: Stack/Layers
        icon: "M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z",
        category: "organize",
    },
    {
        id: "split",
        name: "Split PDF",
        description: "Extract specific pages or split a PDF into multiple files.",
        longDescription: "Split a PDF into multiple files or extract specific pages. No watermarks, no registration required.",
        path: "/tools/split",
        // Icon: Split/Arrows
        icon: "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4",
        category: "organize",
    },
    {
        id: "delete",
        name: "Delete Pages",
        description: "Remove unwanted pages from your PDF document.",
        longDescription: "Delete pages from your PDF with ease. Select pages visually and remove them permanently.",
        path: "/tools/delete",
        // Icon: Trash
        icon: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
        category: "organize",
    },
    {
        id: "organize",
        name: "Organize PDF",
        description: "Reorder and rotate pages in your PDF.",
        longDescription: "Drag and drop to reorder pages. Rotate pages that are upside down. Full control over your document structure.",
        path: "/tools/organize",
        // Icon: Grid
        icon: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z",
        category: "organize",
    },
    {
        id: "pdf-to-image",
        name: "PDF to Image",
        description: "Convert PDF pages to JPG or PNG images.",
        longDescription: "Convert every page of your PDF into a high-quality image. Perfect for sharing on social media or web.",
        path: "/tools/pdf-to-image",
        // Icon: Image
        icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
        category: "convert",
    },
    {
        id: "image-to-pdf",
        name: "Image to PDF",
        description: "Convert JPG and PNG images into a PDF file.",
        longDescription: "Create a PDF from your photos. Supports JPG and PNG formats. Fast and easy.",
        path: "/tools/image-to-pdf",
        // Icon: Document Add
        icon: "M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
        category: "convert",
    },
    {
        id: "watermark",
        name: "Watermark PDF",
        description: "Add text watermarks to your PDF pages.",
        longDescription: "Stamp 'Confidential' or 'Draft' on your documents. Protect your copyright with text watermarks.",
        path: "/tools/watermark",
        // Icon: Shield Check
        icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
        category: "edit",
    },
    {
        id: "page-numbers",
        name: "Add Page Numbers",
        description: "Automatically add page numbers to your PDF.",
        longDescription: "Insert page numbers into your document. Choose position and format.",
        path: "/tools/page-numbers",
        // Icon: Hash/Numbers
        icon: "M7 20l4-16m2 16l4-16M6 9h14M4 15h14",
        category: "edit",
    },
    {
        id: "grayscale",
        name: "Grayscale PDF",
        description: "Convert PDF to grayscale to save ink.",
        longDescription: "Turn your PDF black and white. Ideal for printing documents to save colored ink.",
        path: "/tools/grayscale",
        // Icon: Adjust/Moon
        icon: "M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z",
        category: "convert",
    },
    {
        id: "sign",
        name: "Sign PDF",
        description: "Draw your signature and sign PDF documents.",
        longDescription: "Sign documents electronically. Draw your signature with your mouse or finger.",
        path: "/tools/sign",
        // Icon: Pencil/Signature
        icon: "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z",
        category: "edit",
    },
    {
        id: "edit",
        name: "Edit PDF",
        description: "Add text and edit PDF pages online.",
        longDescription: "Add new text to existing PDF pages. No installation needed.",
        path: "/tools/edit",
        // Icon: Edit/Pencil in square
        icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
        category: "edit",
    },
];