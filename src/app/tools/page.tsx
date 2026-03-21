"use client";

import React, { useState, useEffect, useRef } from 'react';
import { allTools, ToolConfig } from '@/lib/toolsConfig';
import { ToolCard } from '@/components/ui/ToolCard';
import Link from 'next/link';

// Define the structure for our display groups
interface ToolGroup {
    id: string;
    title: string;
    toolIds: string[];
}

// Map existing tools to the categories shown in the design
const toolGroups: ToolGroup[] = [
    {
        id: "popular",
        title: "Most Popular",
        toolIds: ["merge", "split", "edit", "pdf-to-image"],
    },
    {
        id: "organize",
        title: "Organize PDF",
        toolIds: ["organize", "delete"],
    },
    {
        id: "convert-to-pdf",
        title: "Convert to PDF",
        toolIds: ["image-to-pdf"],
    },
    {
        id: "convert-from-pdf",
        title: "Convert from PDF",
        toolIds: ["pdf-to-image", "grayscale"],
    },
    {
        id: "edit",
        title: "Edit & Sign",
        toolIds: ["sign", "watermark", "page-numbers"],
    },
];

export default function AllToolsPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [activeSection, setActiveSection] = useState("popular");
    const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({});

    // Filter tools based on search query
    const filteredGroups = toolGroups.map(group => {
        const tools = group.toolIds
            .map(id => allTools.find(t => t.id === id))
            .filter((t): t is ToolConfig => Boolean(t))
            .filter(tool =>
                tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                tool.description.toLowerCase().includes(searchQuery.toLowerCase())
            );
        return { ...group, tools };
    }).filter(group => group.tools.length > 0);

    // Scroll Spy Logic
    useEffect(() => {
        const handleScroll = () => {
            const scrollPosition = window.scrollY + 200; // Offset for sticky header

            for (const group of toolGroups) {
                const section = sectionRefs.current[group.id];
                if (section) {
                    const { offsetTop, offsetHeight } = section;
                    if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
                        setActiveSection(group.id);
                        break;
                    }
                }
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Scroll to section on click
    const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
        e.preventDefault();
        const section = sectionRefs.current[id];
        if (section) {
            const top = section.offsetTop - 100; // Offset for header
            window.scrollTo({ top, behavior: 'smooth' });
            setActiveSection(id);
        }
    };

    return (
        <main className="bg-slate-50 text-slate-800 antialiased">
            {/* Hero Section */}
            <div className="bg-white border-b border-slate-200">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
                    <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
                        All PDF Tools
                    </h1>
                    <p className="mt-3 text-lg text-slate-500 max-w-2xl mx-auto">
                        Every tool you need to work with PDFs. Secure, free, and easy to use.
                    </p>

                    {/* Search Bar */}
                    <div className="mt-8 max-w-xl mx-auto relative">
                        <input
                            type="text"
                            placeholder="Search for a tool (e.g., Merge, Compress)..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition shadow-sm"
                        />
                        <svg
                            className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                        </svg>
                    </div>
                </div>
            </div>

            {/* Main Layout: Sidebar + Content */}
            <div className="flex max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* SIDEBAR (Desktop) */}
                <aside className="hidden lg:block w-64 flex-shrink-0 border-r border-slate-200 bg-white h-[calc(100vh-64px)] sticky top-16 overflow-y-auto">
                    <div className="p-6">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Categories</h3>
                        <nav className="space-y-1">
                            {filteredGroups.map(group => (
                                <a
                                    key={group.id}
                                    href={`#${group.id}`}
                                    onClick={(e) => handleNavClick(e, group.id)}
                                    className={`block px-3 py-2 rounded-lg text-sm font-medium border-l-2 transition
                    ${activeSection === group.id
                                            ? 'bg-brand-50 text-brand-600 border-brand-600'
                                            : 'text-slate-700 border-transparent hover:bg-slate-50'
                                        }`}
                                >
                                    {group.title}
                                </a>
                            ))}
                        </nav>
                    </div>
                </aside>

                {/* RIGHT CONTENT AREA */}
                <div className="flex-1 min-w-0 py-8">

                    {/* Mobile Category Slider */}
                    <div className="lg:hidden bg-white border-b border-slate-200 sticky top-16 z-30 overflow-x-auto scrollbar-hide mb-6 -mx-4 px-4">
                        <div className="flex space-x-2 py-3">
                            {filteredGroups.map(group => (
                                <a
                                    key={group.id}
                                    href={`#${group.id}`}
                                    onClick={(e) => handleNavClick(e, group.id)}
                                    className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition
                    ${activeSection === group.id
                                            ? 'bg-brand-50 text-brand-600 border border-brand-100'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                >
                                    {group.title}
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Tools Grid Container */}
                    <div className="space-y-10">
                        {filteredGroups.map(group => (
                            <section
                                key={group.id}
                                id={group.id}
                                ref={(el) => { sectionRefs.current[group.id] = el; }}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-bold text-slate-900">{group.title}</h2>
                                    <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded">
                                        {group.tools.length} Tools
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                                    {group.tools.map(tool => (
                                        <ToolCard key={tool.id} tool={tool} />
                                    ))}
                                </div>
                            </section>
                        ))}

                        {/* No Results State */}
                        {filteredGroups.length === 0 && (
                            <div className="text-center py-20">
                                <svg className="w-16 h-16 text-slate-200 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                                <h3 className="text-lg font-medium text-slate-900 mb-1">No tools found</h3>
                                <p className="text-sm text-slate-500">Try adjusting your search or filter.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}