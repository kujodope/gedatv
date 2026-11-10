"use client";

import React, { useEffect, useRef } from "react";
import { X, Film } from "lucide-react";

interface TrailerModalProps {
    isOpen: boolean;
    onClose: () => void;
    trailerUrl: string | null;
    title: string;
}

const TrailerModal = ({ isOpen, onClose, trailerUrl, title }: TrailerModalProps) => {
    // Callers pass inline handlers; a ref keeps the effect below from
    // re-running (and moving focus) on every parent render
    const onCloseRef = useRef(onClose);
    const closeRef = useRef<HTMLButtonElement>(null);
    useEffect(() => {
        onCloseRef.current = onClose;
    });

    // Escape closes; the page behind doesn't scroll while the trailer is open
    useEffect(() => {
        if (!isOpen) return;
        // Return focus to whatever opened the trailer when it closes
        // (captured before focus moves to the close button)
        const opener = document.activeElement as HTMLElement | null;
        closeRef.current?.focus();
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCloseRef.current();
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        window.addEventListener("keydown", onKey);
        return () => {
            document.body.style.overflow = prevOverflow;
            window.removeEventListener("keydown", onKey);
            opener?.focus?.();
        };
    }, [isOpen]);

    // CSS entrance (no exit animation): keeps framer-motion out of the home page bundle
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10"
            role="dialog"
            aria-modal="true"
            aria-label={`${title} trailer`}
        >
            <div onClick={onClose} className="absolute inset-0 bg-black/90" />

            <div className="relative w-full max-w-6xl">
                <div className="mb-3 flex items-center justify-between gap-4">
                    <h2 className="truncate font-display text-base md:text-lg font-bold text-white">
                        {title} <span className="font-sans font-normal text-muted">· Trailer</span>
                    </h2>
                    <button
                        ref={closeRef}
                        onClick={onClose}
                        className="btn-icon h-10 w-10"
                        aria-label="Close trailer"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="aspect-video overflow-hidden rounded-2xl bg-black ring-1 ring-white/10 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)]">
                    {trailerUrl ? (
                        <iframe
                            src={trailerUrl}
                            title={`${title} trailer`}
                            className="h-full w-full border-none"
                            allowFullScreen
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        ></iframe>
                    ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center gap-4 p-8 text-center">
                            <div className="grid h-16 w-16 place-items-center rounded-full bg-white/5 ring-1 ring-white/10">
                                <Film className="h-7 w-7 text-subtle" />
                            </div>
                            <div>
                                <h3 className="font-display text-xl font-bold text-white">No trailer available</h3>
                                <p className="mt-1 text-sm text-muted">We couldn&apos;t find a trailer for this title.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TrailerModal;
