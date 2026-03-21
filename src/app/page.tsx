"use client";

import { Button } from "@/components/ui/Button";
import { ToolCard } from "@/components/ui/ToolCard";
import { allTools, ToolConfig } from "@/lib/toolsConfig";
import { useState } from "react";
import { useFiles } from "@/context/FileContext";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const { addFiles } = useFiles();

  // 1. Define "Most Popular" tools manually for the specific Hero/Grid section
  const popularToolIds = ['merge', 'split', 'organize', 'pdf-to-image', 'edit'];
  const popularTools = popularToolIds
    .map(id => allTools.find(t => t.id === id))
    .filter(Boolean) as ToolConfig[];

  // 2. Group remaining tools (excluding the ones already in Popular to avoid duplication if desired, 
  // or keeping them if you want full category lists. Here we filter for clean categories)
  const convertTools = allTools.filter(t => t.category === 'convert');
  const editTools = allTools.filter(t => t.category === 'edit' && !popularToolIds.includes(t.id));
  const organizeTools = allTools.filter(t => t.category === 'organize' && !popularToolIds.includes(t.id));

  // Handle file selection from the Hero Dropzone
  const handleHeroFiles = (files: File[]) => {
    if (files.length > 0) {
      addFiles(files);
      // Redirect to the merge tool as a default action for generic uploads
      router.push("/tools/merge");
    }
  };

  return (
    <main className="bg-slate-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white border-b border-slate-100">
        <div className="absolute inset-0 opacity-5 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 text-center">
          <div className="animate-fade-in">
            <span className="inline-flex items-center px-3 py-1 rounded-full border border-indigo-100 bg-indigo-50 text-indigo-600 text-xs font-semibold mb-6">
              Trusted by 2M+ Users Globally
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight mb-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            Every PDF Tool You Need.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Simpler, Faster, Safer.</span>
          </h1>

          <p className="max-w-2xl mx-auto text-lg text-slate-500 mb-10 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            The complete PDF solution for professionals. Merge, split, convert, and edit documents with enterprise-grade security and privacy-first processing.
          </p>

          {/* Hero Upload Area - Inline implementation for exact design match */}
          <div className="max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <label
              htmlFor="hero-file-upload"
              className="group cursor-pointer block w-full p-10 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all duration-300"
            >
              <input
                id="hero-file-upload"
                type="file"
                className="hidden"
                accept=".pdf"
                multiple
                onChange={(e) => {
                  if (e.target.files) {
                    handleHeroFiles(Array.from(e.target.files));
                  }
                }}
              />
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-indigo-500 group-hover:bg-indigo-50 transition-colors border border-slate-100">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                  </svg>
                </div>
                <div>
                  <p className="text-lg font-medium text-slate-700">Drop your file(s) here</p>
                  <p className="text-sm text-slate-400 mt-1">or click to browse • 50MB Limit</p>
                </div>
              </div>
            </label>
          </div>
        </div>
      </section>

      {/* Social Proof Bar */}
      <section className="py-10 bg-slate-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-medium text-slate-400 uppercase tracking-widest mb-6">Trusted by teams worldwide</p>
          <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-6 opacity-40 grayscale">
            <div className="h-7 text-slate-700 font-bold text-xl">Microsoft</div>
            <div className="h-7 text-slate-700 font-bold text-xl">Google</div>
            <div className="h-7 text-slate-700 font-bold text-xl">Slack</div>
            <div className="h-7 text-slate-700 font-bold text-xl">Shopify</div>
          </div>
        </div>
      </section>

      {/* Tools Section (Categorized Grid) */}
      <section id="tools" className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Intro Text */}
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900">All Tools, One Place</h2>
            <p className="text-slate-500 mt-2">Select a tool to get started instantly.</p>
          </div>

          {/* Category 1: Most Popular */}
          <div className="mb-12">
            <div className="sticky top-16 py-3 border-b border-slate-200 mb-6 z-10 backdrop-blur-lg bg-slate-50/90">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Most Popular</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {popularTools.map(tool => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          </div>

          {/* Category 2: Organize */}
          {organizeTools.length > 0 && (
            <div className="mb-12">
              <div className="sticky top-16 py-3 border-b border-slate-200 mb-6 z-10 backdrop-blur-lg bg-slate-50/90">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Organize</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {organizeTools.map(tool => (
                  <ToolCard key={tool.id} tool={tool} />
                ))}
              </div>
            </div>
          )}

          {/* Category 3: Convert */}
          <div className="mb-12">
            <div className="sticky top-16 py-3 border-b border-slate-200 mb-6 z-10 backdrop-blur-lg bg-slate-50/90">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Convert</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {convertTools.map(tool => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          </div>

          {/* Category 4: Edit & Sign */}
          <div className="mb-12">
            <div className="sticky top-16 py-3 border-b border-slate-200 mb-6 z-10 backdrop-blur-lg bg-slate-50/90">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Edit & Sign</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {editTools.map(tool => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* How It Works Visual */}
      <section className="py-20 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">How It Works</h2>
            <p className="text-slate-500">Three simple steps to edit your PDF.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting Line */}
            <div className="hidden md:block absolute top-24 left-1/4 right-1/4 h-0.5 bg-slate-200"></div>

            {/* Step 1 */}
            <div className="relative text-center">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-brand-600 mx-auto mb-6 relative z-10">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Upload File</h3>
              <p className="text-sm text-slate-500 px-4">Drag & drop your PDF or click to browse from your device.</p>
            </div>

            {/* Step 2 */}
            <div className="relative text-center">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-brand-600 mx-auto mb-6 relative z-10">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"></path></svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Edit & Process</h3>
              <p className="text-sm text-slate-500 px-4">Choose your tool, make edits, and let our engine handle the rest.</p>
            </div>

            {/* Step 3 */}
            <div className="relative text-center">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-brand-600 mx-auto mb-6 relative z-10">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Download</h3>
              <p className="text-sm text-slate-500 px-4">Get your edited file instantly. Secure and fast.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-slate-50 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Loved by Professionals</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center text-white font-bold text-sm">S</div>
                <div className="ml-3">
                  <h4 className="font-semibold text-slate-900 text-sm">Sarah J.</h4>
                  <p className="text-xs text-slate-500">Marketing Director</p>
                </div>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">"Finally, a PDF merger that doesn't crash on large files. The local processing is incredibly fast. I use it daily."</p>
              <div className="flex mt-4 text-yellow-400">
                {[...Array(5)].map((_, i) => <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" /></svg>)}
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm">M</div>
                <div className="ml-3">
                  <h4 className="font-semibold text-slate-900 text-sm">Mike R.</h4>
                  <p className="text-xs text-slate-500">Freelance Designer</p>
                </div>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">"The privacy focus is what sold me. I work with confidential contracts, and knowing files don't leave my browser is a huge relief."</p>
              <div className="flex mt-4 text-yellow-400">
                {[...Array(5)].map((_, i) => <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" /></svg>)}
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-teal-500 flex items-center justify-center text-white font-bold text-sm">A</div>
                <div className="ml-3">
                  <h4 className="font-semibold text-slate-900 text-sm">Anna L.</h4>
                  <p className="text-xs text-slate-500">Legal Assistant</p>
                </div>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">"Simple, clean, and no watermarks. It's exactly what a PDF tool should be. I recommend it to everyone in my office."</p>
              <div className="flex mt-4 text-yellow-400">
                {[...Array(5)].map((_, i) => <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" /></svg>)}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Teaser */}
      <section id="pricing" className="py-20 bg-white border-t border-slate-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Simple Pricing</h2>
            <p className="text-slate-500">Free forever for essentials. Pro for power users.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <div className="bg-white border border-slate-200 rounded-2xl p-8 flex flex-col relative hover:shadow-lg transition-shadow">
              <h3 className="text-lg font-semibold text-slate-900">Free</h3>
              <p className="mt-2 text-slate-500 text-sm">For individuals and freelancers.</p>
              <div className="mt-6">
                <span className="text-4xl font-bold text-slate-900">$0</span>
                <span className="text-slate-500">/mo</span>
              </div>
              <ul className="mt-6 space-y-3 text-sm text-slate-600 flex-1">
                <li className="flex items-center"><svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>Unlimited Local Processing</li>
                <li className="flex items-center"><svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>Max 50MB File Size</li>
                <li className="flex items-center"><svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>No Registration</li>
              </ul>
              <a href="#tools" className="mt-8 block w-full py-3 bg-slate-100 rounded-lg text-center text-slate-700 font-medium hover:bg-slate-200 transition">Get Started</a>
            </div>

            {/* Pro Plan */}
            <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl p-8 flex flex-col text-white relative hover:shadow-xl transition-shadow overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
              <h3 className="text-lg font-semibold">Pro</h3>
              <p className="mt-2 text-indigo-100 text-sm">For teams and professionals.</p>
              <div className="mt-6">
                <span className="text-4xl font-bold">$9</span>
                <span className="text-indigo-100">/mo</span>
              </div>
              <ul className="mt-6 space-y-3 text-sm text-indigo-50 flex-1">
                <li className="flex items-center"><svg className="w-5 h-5 text-white mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>Unlimited Cloud Processing</li>
                <li className="flex items-center"><svg className="w-5 h-5 text-white mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>2GB Max File Size</li>
                <li className="flex items-center"><svg className="w-5 h-5 text-white mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>Priority Support</li>
              </ul>
              <button className="mt-8 block w-full py-3 bg-white rounded-lg text-center text-indigo-600 font-semibold hover:bg-indigo-50 transition">Upgrade to Pro</button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-slate-50 border-t border-slate-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-4">
            <details className="group bg-white border border-slate-200 rounded-xl open:shadow-lg transition-all duration-200">
              <summary className="flex cursor-pointer items-center justify-between p-6 text-left font-medium text-slate-800 hover:bg-slate-50 rounded-xl transition-colors">
                <span>Is PDF Toolkit really free?</span>
                <span className="ml-4 flex-shrink-0 text-slate-400 group-open:text-indigo-600 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </span>
              </summary>
              <div className="px-6 pb-6 text-slate-600 text-sm leading-relaxed">
                Yes! All local tools (Merge, Split, Compress) are completely free with no limits. We believe essential PDF tools should be accessible to everyone.
              </div>
            </details>

            <details className="group bg-white border border-slate-200 rounded-xl open:shadow-lg transition-all duration-200">
              <summary className="flex cursor-pointer items-center justify-between p-6 text-left font-medium text-slate-800 hover:bg-slate-50 rounded-xl transition-colors">
                <span>Are my files safe?</span>
                <span className="ml-4 flex-shrink-0 text-slate-400 group-open:text-indigo-600 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </span>
              </summary>
              <div className="px-6 pb-6 text-slate-600 text-sm leading-relaxed">
                Absolutely. For "Local" tools, files never leave your computer. We process everything in your browser. We do not store or see your data.
              </div>
            </details>

            <details className="group bg-white border border-slate-200 rounded-xl open:shadow-lg transition-all duration-200">
              <summary className="flex cursor-pointer items-center justify-between p-6 text-left font-medium text-slate-800 hover:bg-slate-50 rounded-xl transition-colors">
                <span>Can I use this on mobile?</span>
                <span className="ml-4 flex-shrink-0 text-slate-400 group-open:text-indigo-600 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </span>
              </summary>
              <div className="px-6 pb-6 text-slate-600 text-sm leading-relaxed">
                PDF Toolkit is fully responsive and works on iOS, Android, and tablets. You can edit PDFs anywhere, anytime.
              </div>
            </details>
          </div>
        </div>
      </section>

      {/* Security Badges */}
      <section className="py-12 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap justify-center items-center gap-8">
          <div className="flex items-center space-x-2 text-slate-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
            <span className="text-xs font-medium">SSL Encryption</span>
          </div>
          <div className="flex items-center space-x-2 text-slate-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
            <span className="text-xs font-medium">GDPR Compliant</span>
          </div>
          <div className="flex items-center space-x-2 text-slate-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
            <span className="text-xs font-medium">No Installation</span>
          </div>
        </div>
      </section>

    </main>
  );
}