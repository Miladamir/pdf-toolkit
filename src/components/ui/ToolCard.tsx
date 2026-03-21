import Link from "next/link";
import { ToolConfig } from "@/lib/toolsConfig";

interface ToolCardProps {
    tool: ToolConfig;
    variant?: "light" | "dark";
}

// Helper to map tool IDs to specific colors
const getToolColors = (id: string) => {
    const colorMap: Record<string, { bg: string; text: string }> = {
        merge: { bg: "bg-indigo-100", text: "text-indigo-600" },
        split: { bg: "bg-pink-100", text: "text-pink-600" },
        "pdf-to-image": { bg: "bg-blue-100", text: "text-blue-600" },
        "image-to-pdf": { bg: "bg-green-100", text: "text-green-600" },
        edit: { bg: "bg-rose-100", text: "text-rose-600" },
        sign: { bg: "bg-amber-100", text: "text-amber-600" },
        watermark: { bg: "bg-cyan-100", text: "text-cyan-600" },
        "page-numbers": { bg: "bg-purple-100", text: "text-purple-600" },
        delete: { bg: "bg-red-100", text: "text-red-600" },
        organize: { bg: "bg-violet-100", text: "text-violet-600" },
        grayscale: { bg: "bg-gray-100", text: "text-gray-600" },
    };

    return colorMap[id] || { bg: "bg-slate-100", text: "text-slate-600" };
};

export const ToolCard: React.FC<ToolCardProps> = ({ tool, variant = "light" }) => {
    const colors = getToolColors(tool.id);
    const isDark = variant === "dark";

    return (
        <Link
            href={tool.path}
            className={`
                group block p-6 rounded-2xl border transition-all duration-300
                ${isDark
                    ? "bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 shadow-lg hover:shadow-2xl hover:shadow-indigo-500/20"
                    : "bg-white border-slate-200 hover:border-brand-200 hover:shadow-xl hover:-translate-y-1"
                }
            `}
        >
            <div className="flex items-start justify-between mb-4">
                {/* Icon Container - Increased size */}
                <div
                    className={`
                        w-14 h-14 rounded-xl flex items-center justify-center shadow-sm
                        transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3
                        ${isDark
                            ? "bg-white/10 backdrop-blur text-white"
                            : `${colors.bg} ${colors.text}`
                        }
                    `}
                >
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={tool.icon}></path>
                    </svg>
                </div>

                {/* Badge */}
                <span
                    className={`
                        text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full
                        ${isDark
                            ? "text-green-400 bg-white/10"
                            : "text-green-700 bg-green-50"
                        }
                    `}
                >
                    Local
                </span>
            </div>

            {/* Content - Increased text sizes */}
            <h3
                className={`
                    text-base font-bold mb-2
                    ${isDark ? "text-white" : "text-slate-900"}
                `}
            >
                {tool.name}
            </h3>

            <p
                className={`
                    text-sm leading-relaxed mb-4 line-clamp-2
                    ${isDark ? "text-slate-300" : "text-slate-500"}
                `}
            >
                {tool.description}
            </p>

            {/* Footer / Action */}
            <div
                className={`
                    flex items-center font-semibold text-sm
                    ${isDark ? "text-indigo-300 group-hover:text-white" : "text-brand-600"}
                `}
            >
                Select Files
                <svg
                    className="w-4 h-4 ml-1.5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
                </svg>
            </div>
        </Link>
    );
};