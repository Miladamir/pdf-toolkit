import { Container } from "@/components/ui/Container";
import Link from "next/link";
import { allTools } from "@/lib/toolsConfig";

export const Footer = () => {
    // Dynamic tool groups
    const organizeTools = allTools.filter(t => t.category === 'organize');
    const convertTools = allTools.filter(t => t.category === 'convert');
    const editTools = allTools.filter(t => t.category === 'edit');

    return (
        <footer className="bg-slate-900 text-slate-300 pt-16 pb-8">
            <Container>
                {/* Top Section: Brand & Newsletter */}
                <div className="grid lg:grid-cols-3 gap-8 pb-12 border-b border-slate-800">
                    {/* Brand Info */}
                    <div className="lg:col-span-1">
                        <div className="flex items-center space-x-2 mb-4">
                            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                </svg>
                            </div>
                            <span className="text-xl font-bold text-white">PDF Toolkit</span>
                        </div>
                        <p className="text-slate-400 text-sm leading-relaxed mb-4">
                            Making PDF management easy, secure, and accessible for everyone. All your tools in one place.
                        </p>
                        <div className="flex space-x-4">
                            <a href="#" className="text-slate-400 hover:text-white transition">
                                <span className="sr-only">Twitter</span>
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path></svg>
                            </a>
                            <a href="#" className="text-slate-400 hover:text-white transition">
                                <span className="sr-only">GitHub</span>
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"></path></svg>
                            </a>
                        </div>
                    </div>

                    {/* Newsletter */}
                    <div className="lg:col-span-2 lg:pl-12">
                        <h3 className="text-lg font-semibold text-white mb-2">Subscribe to our newsletter</h3>
                        <p className="text-slate-400 text-sm mb-4">Get the latest updates, tips, and exclusive offers directly in your inbox.</p>
                        <form className="sm:flex sm:max-w-md">
                            <input
                                type="email"
                                required
                                className="w-full min-w-0 px-4 py-2 placeholder-slate-500 text-white bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="Enter your email"
                            />
                            <div className="mt-3 rounded-lg sm:mt-0 sm:ml-3 sm:flex-shrink-0">
                                <button type="submit" className="w-full flex items-center justify-center px-5 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900">
                                    Subscribe
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Middle Section: Links Grid */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-8 py-12">
                    {/* Product */}
                    <div className="col-span-1">
                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Product</h3>
                        <ul className="space-y-3 text-sm">
                            <li><Link href="/#features" className="hover:text-white transition">Features</Link></li>
                            <li><Link href="/pricing" className="hover:text-white transition">Pricing</Link></li>
                            <li><Link href="/privacy" className="hover:text-white transition">Privacy</Link></li>
                        </ul>
                    </div>

                    {/* Organize */}
                    <div className="col-span-1">
                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Organize</h3>
                        <ul className="space-y-3 text-sm">
                            {organizeTools.map(tool => (
                                <li key={tool.id}>
                                    <Link href={tool.path} className="hover:text-white transition">{tool.name}</Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Convert */}
                    <div className="col-span-1">
                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Convert</h3>
                        <ul className="space-y-3 text-sm">
                            {convertTools.map(tool => (
                                <li key={tool.id}>
                                    <Link href={tool.path} className="hover:text-white transition">{tool.name}</Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Edit & Sign */}
                    <div className="col-span-1">
                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Edit & Sign</h3>
                        <ul className="space-y-3 text-sm">
                            {editTools.map(tool => (
                                <li key={tool.id}>
                                    <Link href={tool.path} className="hover:text-white transition">{tool.name}</Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Company */}
                    <div className="col-span-1">
                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Company</h3>
                        <ul className="space-y-3 text-sm">
                            <li><Link href="/about" className="hover:text-white transition">About Us</Link></li>
                            <li><Link href="/contact" className="hover:text-white transition">Contact</Link></li>
                            <li><Link href="/terms" className="hover:text-white transition">Terms</Link></li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Section */}
                <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center text-xs">
                    <div className="flex flex-wrap justify-center md:justify-start items-center gap-x-4 gap-y-2 text-slate-400 mb-4 md:mb-0">
                        <span>© {new Date().getFullYear()} PDF Toolkit. All rights reserved.</span>
                        <Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link>
                        <Link href="/terms" className="hover:text-white transition">Terms of Service</Link>
                    </div>

                    <div className="flex items-center space-x-4 text-slate-500">
                        <div className="flex items-center space-x-1">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                            <span>SSL Secured</span>
                        </div>
                        <div className="flex items-center space-x-1">
                            <span>GDPR Ready</span>
                        </div>
                    </div>
                </div>
            </Container>
        </footer>
    );
};