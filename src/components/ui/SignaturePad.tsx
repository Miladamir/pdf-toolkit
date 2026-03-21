"use client";

import { useRef, useState, useEffect } from "react";

interface SignaturePadProps {
    onConfirm: (dataUrl: string) => void;
    onCancel: () => void;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({ onConfirm, onCancel }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);

    useEffect(() => {
        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext("2d");
            if (ctx) {
                ctx.strokeStyle = "black";
                ctx.lineWidth = 2;
                ctx.lineCap = "round";
                setContext(ctx);
            }
        }
    }, []);

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        if (!context) return;
        setIsDrawing(true);

        const rect = canvasRef.current!.getBoundingClientRect();
        let clientX, clientY;

        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        context.beginPath();
        context.moveTo(clientX - rect.left, clientY - rect.top);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing || !context) return;

        const rect = canvasRef.current!.getBoundingClientRect();
        let clientX, clientY;

        if ('touches' in e) {
            e.preventDefault(); // Prevent scrolling while drawing
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        context.lineTo(clientX - rect.left, clientY - rect.top);
        context.stroke();
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        if (context) context.closePath();
    };

    const handleClear = () => {
        if (context && canvasRef.current) {
            context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
    };

    const handleConfirm = () => {
        if (canvasRef.current) {
            const dataUrl = canvasRef.current.toDataURL("image/png");
            onConfirm(dataUrl);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Draw Signature</h3>
                <div className="border-2 border-dashed border-slate-300 rounded-lg overflow-hidden">
                    <canvas
                        ref={canvasRef}
                        width={400}
                        height={200}
                        className="w-full bg-white cursor-crosshair touch-none"
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                    />
                </div>
                <div className="flex justify-end gap-3">
                    <button onClick={handleClear} className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg">
                        Clear
                    </button>
                    <button onClick={onCancel} className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg">
                        Cancel
                    </button>
                    <button onClick={handleConfirm} className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-hover">
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
};