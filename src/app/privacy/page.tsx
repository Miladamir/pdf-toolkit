import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";

export const metadata = {
    title: "Privacy Policy - PDFToolkit",
    description: "Your privacy is our priority. Learn how PDFToolkit processes your files locally in your browser.",
};

export default function PrivacyPage() {
    return (
        <section className="py-20">
            <Container>
                <div className="max-w-3xl mx-auto space-y-8">
                    <h1 className="text-4xl font-bold text-foreground">Privacy Policy</h1>
                    <p className="text-lg text-muted-foreground">
                        Last updated: {new Date().toLocaleDateString()}
                    </p>

                    <Card className="bg-primary/5 border-primary/20 p-6">
                        <h2 className="text-xl font-bold text-foreground mb-2">The Short Version</h2>
                        <p className="text-foreground font-medium">
                            We do not store, read, or see your files. Everything happens in your browser.
                        </p>
                    </Card>

                    <div className="prose prose-slate max-w-none">
                        <h2>1. How We Process Your Data</h2>
                        <p>
                            PDFToolkit is designed with privacy at its core. Unlike traditional online PDF editors,
                            our tools run entirely within your web browser using modern JavaScript technologies.
                        </p>
                        <ul>
                            <li><strong>Client-Side Processing:</strong> When you upload a file to our website, it is not sent to our servers. It stays on your device (computer/phone) and is processed locally by your browser.</li>
                            <li><strong>No Server Storage:</strong> We do not have a database to store your files. Once you close the tab or refresh the page, the data is gone.</li>
                            <li><strong>No Backups:</strong> Since we never receive your data, we cannot back it up, share it, or analyze it.</li>
                        </ul>

                        <h2>2. Information We Do Collect</h2>
                        <p>
                            While we don't see your files, we may collect anonymous usage data to improve our service:
                        </p>
                        <ul>
                            <li><strong>Analytics:</strong> We use simple analytics to understand how many people visit our site and which tools are most popular.</li>
                            <li><strong>Error Logs:</strong> If a tool crashes, we may receive an automated error report to help us fix bugs.</li>
                        </ul>

                        <h2>3. Third-Party Services</h2>
                        <p>
                            We use the following third-party services that may collect limited data:
                        </p>
                        <ul>
                            <li>Google Analytics (for traffic analysis)</li>
                            <li>Vercel (for hosting our website code)</li>
                        </ul>

                        <h2>4. Cookies</h2>
                        <p>
                            We use essential cookies to ensure the website functions correctly (e.g., remembering your dark mode preference).
                        </p>

                        <h2>5. Contact</h2>
                        <p>
                            If you have questions about this policy, contact us at: <strong>support@pdftoolkit.com</strong>
                        </p>
                    </div>
                </div>
            </Container>
        </section>
    );
}