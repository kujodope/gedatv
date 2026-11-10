"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import MovieCard from "./MovieCard";
import type { Movie } from "@/lib/tmdb";
import { cn } from "@/lib/utils";

interface MovieRowProps {
    title: string;
    movies: Movie[];
    className?: string;
    cardClassName?: string;
    isResume?: boolean;
    onRemove?: (id: string, type: string) => void;
    seeAllUrl?: string;
    // Small line under the title, e.g. "Pick up where you left off"
    subtitle?: string;
    icon?: React.ReactNode;
    badge?: string;
}


const getSeeAllUrl = (title: string): string | null => {
    const lower = title.toLowerCase().trim();

    // 1. Core Pages Mapping
    if (lower === "popular movies") return "/movies";
    if (lower === "tv shows" || lower === "popular series") return "/tv";
    if (lower === "my list" || lower === "watchlist") return "/watchlist";

    // 2. Movie Genre Pages (from homepage, categories page, movies page)
    if (lower === "action blockbusters" || lower === "action movies") {
        return "/categories/28?name=Action&type=movie";
    }
    if (lower === "comedy hits" || lower === "comedy movies") {
        return "/categories/35?name=Comedy&type=movie";
    }
    if (lower === "horror movies" || lower === "chilling horror") {
        return "/categories/27?name=Horror&type=movie";
    }
    if (lower === "animation favorites" || lower === "animated wonders") {
        return "/categories/16?name=Animation&type=movie";
    }
    if (lower === "drama series" || lower === "gripping dramas" || lower === "drama movies") {
        return "/categories/18?name=Drama&type=tv";
    }
    if (lower === "sci-fi & fantasy") {
        return "/categories/10765?name=Sci-Fi%20%26%20Fantasy&type=tv";
    }
    if (lower === "adventure quests") {
        return "/categories/12?name=Adventure&type=movie";
    }
    if (lower === "crime thrillers") {
        return "/categories/80?name=Crime&type=movie";
    }
    if (lower === "mystery & suspense") {
        return "/categories/9648?name=Mystery&type=movie";
    }
    if (lower === "romantic getaways") {
        return "/categories/10749?name=Romance&type=movie";
    }
    if (lower === "reality obsessions") {
        return "/categories/10764?name=Reality&type=tv";
    }
    if (lower === "insightful documentaries") {
        return "/categories/99?name=Documentary&type=movie";
    }
    if (lower === "wild west tales") {
        return "/categories/37?name=Western&type=movie";
    }
    if (lower === "musical journeys") {
        return "/categories/10402?name=Music&type=movie";
    }
    if (lower === "historic wars") {
        return "/categories/36?name=History&type=movie";
    }
    if (lower === "action & adventure") {
        return "/categories/10759?name=Action%20%26%20Adventure&type=tv";
    }

    // Default to null for contextual or non-paginated rows (Trending Now, Recently Played, Recommendations, Similar, Airing Today, Known For, etc.)
    return null;
};

// Cards past this index keep their space but don't download artwork until the
// row is scrolled near them (browsers otherwise fetch many off-screen cards in
// every horizontal row). Covers the first screenful on common displays.
const INITIAL_IMAGE_COUNT = 5;
// Cards rendered before the row is scrolled: enough to fill a wide screen.
// The rest are added as the row scrolls, which keeps the first page load
// (HTML size and hydration work) small.
const INITIAL_CARD_COUNT = 10;
const CARDS_AHEAD = 4;
const CARD_GAP = 12; // gap-3

const MovieRow = ({ title, movies, className, cardClassName, isResume = false, onRemove, seeAllUrl, subtitle, icon, badge }: MovieRowProps) => {
    const rowRef = useRef<HTMLDivElement>(null);
    const [imageLimit, setImageLimit] = useState(INITIAL_IMAGE_COUNT);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    // Load artwork for what is visible plus half a screen ahead; only grows.
    // Also tracks whether there is anything to scroll to on each side.
    const handleScroll = useCallback(() => {
        const el = rowRef.current;
        const first = el?.firstElementChild as HTMLElement | null;
        if (!el || !first) return;
        const stride = first.offsetWidth + CARD_GAP;
        const needed = Math.ceil((el.scrollLeft + el.clientWidth * 1.5) / stride);
        setImageLimit((prev) => (needed > prev ? needed : prev));
        setCanScrollLeft(el.scrollLeft > 8);
        setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
    }, []);

    const renderCount = Math.max(INITIAL_CARD_COUNT, imageLimit + CARDS_AHEAD);

    useEffect(() => {
        handleScroll();
    }, [handleScroll, movies.length, renderCount]);

    // Measure again whenever the row's width changes. A single measurement at
    // mount can come back empty (rows below the fold aren't laid out yet, a tab
    // opened in the background), which left visible cards without posters
    // until the row was scrolled; this also covers resizes and rotation.
    const hasMovies = movies.length > 0;
    useEffect(() => {
        const el = rowRef.current;
        if (!el || typeof ResizeObserver === "undefined") return;
        const observer = new ResizeObserver(() => handleScroll());
        observer.observe(el);
        return () => observer.disconnect();
    }, [handleScroll, hasMovies]);

    const resolvedSeeAllUrl = seeAllUrl ?? getSeeAllUrl(title);

    if (!movies.length) return null;

    const scroll = (direction: "left" | "right") => {
        if (rowRef.current) {
            const { scrollLeft, clientWidth } = rowRef.current;
            const distance = clientWidth * 0.85;
            const scrollTo = direction === "left" ? scrollLeft - distance : scrollLeft + distance;
            rowRef.current.scrollTo({ left: scrollTo });
        }
    };

    const headingId = `row-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

    return (
        <section
            aria-labelledby={headingId}
            // Rows off screen skip layout and paint until they're scrolled near
            className={cn("group/row relative page-gutter [content-visibility:auto] [contain-intrinsic-size:auto_360px]", className)}
        >
            <div className="mb-3 md:mb-4 flex items-end justify-between gap-4">
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        {icon && <span className="shrink-0">{icon}</span>}
                        <h2 id={headingId} className="font-display text-xl md:text-2xl font-semibold tracking-tight text-white flex items-center gap-2">
                            {resolvedSeeAllUrl ? (
                                <Link href={resolvedSeeAllUrl} className="hover:text-white">
                                    {title}
                                </Link>
                            ) : title}
                            {badge && (
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent/20 text-accent border border-accent/30">
                                    {badge}
                                </span>
                            )}
                        </h2>
                    </div>
                    {subtitle && <p className="mt-0.5 text-[13px] text-muted">{subtitle}</p>}
                </div>

                <div className="flex items-center gap-2">
                    {resolvedSeeAllUrl && (
                        <Link
                            href={resolvedSeeAllUrl}
                            className="inline-flex items-center gap-0.5 text-[13px] font-medium text-white/70 hover:text-white"
                        >
                            View All
                            <ChevronRight className="h-4 w-4" aria-hidden="true" />
                        </Link>
                    )}
                    {/* Compact arrow pair for keyboard / trackpad-less users on desktop */}
                    <div className="hidden">
                        <button
                            onClick={() => scroll("left")}
                            disabled={!canScrollLeft}
                            aria-label={`Scroll ${title} left`}
                            className="grid h-8 w-8 place-items-center rounded-full border border-line text-gray-300 hover:border-line-strong hover:text-white disabled:opacity-30 disabled:pointer-events-none"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => scroll("right")}
                            disabled={!canScrollRight}
                            aria-label={`Scroll ${title} right`}
                            className="grid h-8 w-8 place-items-center rounded-full border border-line text-gray-300 hover:border-line-strong hover:text-white disabled:opacity-30 disabled:pointer-events-none"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="relative">
                <div
                    ref={rowRef}
                    onScroll={handleScroll}
                    className="flex gap-3 overflow-x-auto overflow-y-hidden scrollbar-none overscroll-x-contain snap-x snap-mandatory
                        -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10 xl:-mx-14 xl:px-14
                        scroll-pl-4 sm:scroll-pl-6 lg:scroll-pl-10 xl:scroll-pl-14
                        pt-2 pb-4 -mt-2 -mb-4"
                >
                    {movies.slice(0, renderCount).map((movie, index) => (
                        <MovieCard
                            key={`${movie.id}-${movie.media_type}`}
                            movie={movie}
                            isResume={isResume}
                            className={cn("snap-start", cardClassName)}
                            onRemove={onRemove}
                            isFirst={index === 0}
                            isLast={index === movies.length - 1}
                            loadImage={index < imageLimit}
                        />
                    ))}
                </div>

                {/* Edge fades double as large click targets on desktop */}
                <button
                    onClick={() => scroll("left")}
                    tabIndex={-1}
                    aria-hidden="true"
                    className={cn(
                        "hidden md:flex absolute inset-y-0 md:-left-6 md:w-6 lg:-left-10 lg:w-10 xl:-left-14 xl:w-14 z-30 items-center justify-center",
                        "bg-gradient-to-r from-black via-black/70 to-transparent text-white",
                        canScrollLeft ? "opacity-0 group-hover/row:opacity-100" : "opacity-0 pointer-events-none"
                    )}
                >
                    <ChevronLeft className="h-7 w-7" />
                </button>
                <button
                    onClick={() => scroll("right")}
                    tabIndex={-1}
                    aria-hidden="true"
                    className={cn(
                        "hidden md:flex absolute inset-y-0 md:-right-6 md:w-6 lg:-right-10 lg:w-10 xl:-right-14 xl:w-14 z-30 items-center justify-center",
                        "bg-gradient-to-l from-black via-black/70 to-transparent text-white",
                        canScrollRight ? "opacity-0 group-hover/row:opacity-100" : "opacity-0 pointer-events-none"
                    )}
                >
                    <ChevronRight className="h-7 w-7" />
                </button>
            </div>
        </section>
    );
};

export default MovieRow;
