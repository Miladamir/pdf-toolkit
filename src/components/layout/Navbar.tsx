"use client";

import { Container } from "@/components/ui/Container";
import Link from "next/link";
import { useState, useEffect } from "react";
import { allTools } from "@/lib/toolsConfig";

export const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 10);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const getIconColors = (id: string) => {
        const colors: Record<string, string> = {
            merge: "bg-indigo-50 text-indigo-600",
            split: "bg-pink-50 text-pink-600",
            delete: "bg-red-50 text-red-600",
            organize: "bg-violet-50 text-violet-600",
            "pdf-to-image": "bg-blue-50 text-blue-600",
            "image-to-pdf": "bg-green-50 text-green-600",
            watermark: "bg-cyan-50 text-cyan-600",
            "page-numbers": "bg-purple-50 text-purple-600",
            sign: "bg-amber-50 text-amber-600",
            edit: "bg-rose-50 text-rose-600",
            grayscale: "bg-slate-100 text-slate-600",
        };
        return colors[id] || "bg-slate-100 text-slate-600";
    };

    const popularTools = allTools.filter(t => ['merge', 'split', 'organize'].includes(t.id));
    const convertTools = allTools.filter(t => t.category === 'convert');
    const editTools = allTools.filter(t => t.category === 'edit');

    return (
        <header className={`fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 transition-shadow duration-300 ${isScrolled ? 'shadow-sm' : ''}`}>
            <Container>
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center space-x-2 flex-shrink-0">
                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                        </div>
                        <span className="text-xl font-bold text-slate-900">PDF Toolkit</span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center space-x-1 flex-grow justify-center">

                        {/* Tools Dropdown */}
                        <div className="relative nav-group">
                            <button className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-brand-600 transition rounded-lg hover:bg-slate-50 flex items-center">
                                Tools
                                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </button>

                            {/* Mega Menu */}
                            <div className="nav-mega-menu absolute top-full left-1/2 -translate-x-1/2 w-screen max-w-4xl pt-2">
                                <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 grid grid-cols-3 gap-6">

                                    {/* Column 1: Popular */}
                                    <div>
                                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Most Popular</h3>
                                        <ul className="space-y-1">
                                            {popularTools.map(tool => (
                                                <li key={tool.id}>
                                                    <Link href={tool.path} className="flex items-center p-2 rounded-lg hover:bg-slate-50 group transition-colors">
                                                        <span className={`w-8 h-8 rounded ${getIconColors(tool.id)} flex items-center justify-center mr-3 group-hover:scale-110 transition-transform`}>
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={tool.icon}></path>
                                                            </svg>
                                                        </span>
                                                        <span className="text-sm font-medium text-slate-700">{tool.name}</span>
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Column 2: Convert */}
                                    <div>
                                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Convert</h3>
                                        <ul className="space-y-1">
                                            {convertTools.map(tool => (
                                                <li key={tool.id}>
                                                    <Link href={tool.path} className="flex items-center p-2 rounded-lg hover:bg-slate-50 group transition-colors">
                                                        <span className={`w-8 h-8 rounded ${getIconColors(tool.id)} flex items-center justify-center mr-3 group-hover:scale-110 transition-transform`}>
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={tool.icon}></path>
                                                            </svg>
                                                        </span>
                                                        <span className="text-sm font-medium text-slate-700">{tool.name}</span>
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Column 3: Edit */}
                                    <div>
                                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Edit</h3>
                                        <ul className="space-y-1">
                                            {editTools.map(tool => (
                                                <li key={tool.id}>
                                                    <Link href={tool.path} className="flex items-center p-2 rounded-lg hover:bg-slate-50 group transition-colors">
                                                        <span className={`w-8 h-8 rounded ${getIconColors(tool.id)} flex items-center justify-center mr-3 group-hover:scale-110 transition-transform`}>
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={tool.icon}></path>
                                                            </svg>
                                                        </span>
                                                        <span className="text-sm font-medium text-slate-700">{tool.name}</span>
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Link href="/pricing" className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-brand-600 transition rounded-lg hover:bg-slate-50">Pricing</Link>
                    </nav>

                    {/* Right Side */}
                    <div className="flex items-center space-x-2">
                        <div className="hidden md:block relative">
                            <input type="text" placeholder="Search tools..." className="w-48 lg:w-56 py-2 pl-9 pr-4 text-sm bg-slate-100 border-none rounded-lg focus:ring-2 focus:ring-brand-500 focus:bg-white transition text-slate-800 placeholder-slate-400" />
                            <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        </div>
                        <Link href="/login" className="hidden sm:block text-sm font-medium text-slate-600 hover:text-brand-600 transition px-3 py-2">Login</Link>
                        <Link href="/signup" className="inline-flex items-center px-4 py-2 bg-brand-600 rounded-lg text-sm font-semibold text-white shadow-sm hover:bg-brand-700 transition hover:shadow-md">Start Free</Link>
                        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition">
                            <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">{isMenuOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />}</svg>
                        </button>
                    </div>
                </div>
            </Container>

            {/* Mobile Menu */}
            <div className={`md:hidden bg-white border-t border-slate-100 shadow-lg mobile-menu ${isMenuOpen ? 'open' : ''}`}>
                <div className="px-4 py-4 space-y-1">
                    <input type="text" placeholder="Search tools..." className="w-full py-2 pl-9 pr-4 text-sm bg-slate-100 rounded-lg mb-2 text-slate-800 placeholder-slate-400" />
                    {allTools.slice(0, 4).map(tool => (
                        <Link key={tool.id} href={tool.path} className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50" onClick={() => setIsMenuOpen(false)}>
                            {tool.name}
                        </Link>
                    ))}
                    <div className="pt-4 border-t border-slate-100 mt-4">
                        <Link href="/signup" className="block w-full text-center py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition">Start Free</Link>
                    </div>
                </div>
            </div>
        </header>
    );
};