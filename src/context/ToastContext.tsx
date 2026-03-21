"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback } from "react";

type ToastType = "success" | "error" | "info";

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = "info") => {
        const id = Math.random().toString(36).substr(2, 9);

        setToasts((prev) => [...prev, { id, message, type }]);

        // Auto-remove after 4 seconds
        setTimeout(() => {
            setToasts((prev) => prev.filter((toast) => toast.id !== id));
        }, 4000);
    }, []);

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}

            {/* Toast Container - Fixed bottom right */}
            <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`
              p-4 rounded-lg shadow-lg border text-sm font-medium min-w-[250px] 
              animate-in slide-in-from-right-full fade-in duration-300
              ${toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : ''}
              ${toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : ''}
              ${toast.type === 'info' ? 'bg-blue-50 border-blue-200 text-blue-800' : ''}
            `}
                    >
                        <div className="flex justify-between items-center gap-4">
                            <span>{toast.message}</span>
                            <button onClick={() => removeToast(toast.id)} className="text-current opacity-50 hover:opacity-100">
                                ✕
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
};