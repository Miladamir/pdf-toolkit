import { Container } from "@/components/ui/Container";

export const metadata = {
    title: "Terms of Service - PDFToolkit",
    description: "Terms of service for using PDFToolkit online PDF editor.",
};

export default function TermsPage() {
    return (
        <section className="py-20">
            <Container>
                <div className="max-w-3xl mx-auto space-y-8">
                    <h1 className="text-4xl font-bold text-foreground">Terms of Service</h1>

                    <div className="space-y-6 text-muted-foreground">
                        <p>
                            By accessing and using PDFToolkit, you agree to be bound by these Terms of Service.
                        </p>

                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold text-foreground">1. Use at Your Own Risk</h2>
                            <p>
                                Our tools are provided "as is" without warranty of any kind. We are not responsible for any damage to your files or device resulting from the use of our service. Always keep backups of important documents.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold text-foreground">2. Permitted Use</h2>
                            <p>
                                You may use our tools for personal or commercial purposes. You agree not to use our website for any illegal purpose or in any way that could damage the service.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold text-foreground">3. Intellectual Property</h2>
                            <p>
                                The website design, logo, and code are the property of PDFToolkit. You may not copy or redistribute the source code without permission.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold text-foreground">4. Changes</h2>
                            <p>
                                We reserve the right to modify these terms at any time. Continued use of the service after changes constitutes acceptance of the new terms.
                            </p>
                        </div>
                    </div>
                </div>
            </Container>
        </section>
    );
}