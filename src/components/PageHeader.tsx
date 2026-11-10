import React from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
    eyebrow?: string;
    title: React.ReactNode;
    description?: React.ReactNode;
    // Right-aligned slot (counts, actions)
    aside?: React.ReactNode;
    className?: string;
}

// Shared heading block for browse pages (categories, people, studios, awards, ...)
export default function PageHeader({ eyebrow, title, description, aside, className }: PageHeaderProps) {
    return (
        <header className={cn("relative mb-10 md:mb-12", className)}>
            {/* soft accent glow behind the heading */}
            <div aria-hidden="true" className="pointer-events-none absolute -top-32 -left-24 h-72 w-[36rem] max-w-full rounded-full bg-accent/[0.07] blur-3xl" />
            <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                <div className="max-w-3xl">
                    {eyebrow && <p className="eyebrow mb-3 text-accent">{eyebrow}</p>}
                    <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-extrabold leading-[1] tracking-[-0.035em] text-white text-balance">
                        {title}
                    </h1>
                    {description && (
                        <p className="mt-4 max-w-2xl text-[15px] md:text-base leading-relaxed text-muted text-pretty">{description}</p>
                    )}
                </div>
                {aside && <div className="shrink-0">{aside}</div>}
            </div>
        </header>
    );
}
