import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { FileProvider } from "@/context/FileContext";
import { ToastProvider } from "@/context/ToastContext";
import { JsonLd } from "@/components/seo/JsonLd";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "PDF Toolkit - Professional PDF Tools",
    template: "%s | PDF Toolkit"
  },
  description: "Fast, secure, and private PDF tools. Merge, split, compress, convert, and edit PDFs directly in your browser.",
  keywords: ["PDF", "Merge PDF", "Split PDF", "Compress PDF", "Edit PDF", "Online PDF Tools"],
  authors: [{ name: "PDF Toolkit Team" }],
  creator: "PDF Toolkit",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://pdftoolkit.com",
    siteName: "PDF Toolkit",
    title: "PDF Toolkit - Professional PDF Tools",
    description: "Fast, secure, and private PDF tools.",
  },
  twitter: {
    card: "summary_large_image",
    title: "PDF Toolkit",
    description: "Fast, secure, and private PDF tools.",
  },
};

// Global Schema for Organization
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "PDF Toolkit",
  url: "https://pdftoolkit.com",
  logo: "https://pdftoolkit.com/logo.png",
  sameAs: [
    "https://twitter.com/pdftoolkit",
    "https://github.com/pdftoolkit"
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} min-h-screen flex flex-col bg-slate-50 text-slate-800 antialiased`}>
        {/* Inject Global JSON-LD */}
        <JsonLd data={organizationSchema} />

        <Navbar />

        <FileProvider>
          <ToastProvider>
            <main className="flex-grow pt-16"> {/* Added pt-16 to offset fixed header */}
              {children}
            </main>
          </ToastProvider>
        </FileProvider>

        <Footer />
      </body>
    </html>
  );
}