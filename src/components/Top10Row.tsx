"use client";

import React, { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import type { Movie } from "@/lib/tmdb";
import { tmdbImage, posterSrcSet, POSTER_CARD_SIZES } from "@/lib/images";
import { cn } from "@/lib/utils";

interface Top10RowProps {
    title: string;
    movies: Movie[];
}

// Ranked poster row with oversized outline numerals. Uses the list it is given
// (the home page passes the same "trending today" list it already fetched).
export default function Top10Row({ title, movies }: Top10RowProps) {
    const rowRef = useRef<HTMLOListElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const items = movies.filter((m) => m.poster_path && (m.media_type === "movie" || m.media_type === "tv")).slice(0, 10);

    const handleScroll = useCallback(() => {
        const el = rowRef.current;
        if (!el) return;
        setCanScrollLeft(el.scrollLeft > 8);
        setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
    }, []);

    if (items.length < 5) return null;

    const scroll = (direction: "left" | "right") => {
        const el = rowRef.current;
        if (!el) return;
        const distance = el.clientWidth * 0.85;
        el.scrollTo({ left: el.scrollLeft + (direction === "left" ? -distance : distance), behavior: "instant" });
    };

    return (
        <section aria-labelledby="top10-heading" className="group/row relative page-gutter">
            <div className="mb-3 md:mb-4 flex items-end justify-between gap-4">
                <h2 id="top10-heading" className="font-display text-lg sm:text-xl md:text-[22px] font-bold tracking-tight text-white">
                    {title}
                </h2>
                <div className="hidden md:flex items-center gap-1">
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

            <ol
                ref={rowRef}
                onScroll={handleScroll}
                className="flex gap-1 sm:gap-2 overflow-x-auto overflow-y-hidden scrollbar-none overscroll-x-contain snap-x snap-mandatory
                    -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10 xl:-mx-14 xl:px-14
                    scroll-pl-4 sm:scroll-pl-6 lg:scroll-pl-10 xl:scroll-pl-14 pt-2 pb-4 -mt-2 -mb-4"
            >
                {items.map((movie, index) => {
                    const type = movie.media_type === "tv" ? "tv" : "movie";
                    const itemTitle = movie.title || movie.name || "Untitled";
                    return (
                        <li key={`${movie.id}-${type}`} className="snap-start flex-none flex items-end">
                            <Link
                                href={`/watch/${type}/${movie.id}`}
                                prefetch={false}
                                className="group/top flex items-end"
                                aria-label={`${index + 1}. ${itemTitle}`}
                            >
                                <span
                                    aria-hidden="true"
                                    className="font-display font-extrabold leading-[0.75] tracking-[-0.08em] text-transparent select-none
                                        text-[96px] sm:text-[120px] lg:text-[150px] -mr-3 sm:-mr-4 lg:-mr-5
                                        [-webkit-text-stroke:2px_rgba(255,255,255,0.28)]
                                        group-hover/top:[-webkit-text-stroke-color:rgba(255,255,255,0.7)]"
                                >
                                    {index + 1}
                                </span>
                                <span className="relative block w-[112px] sm:w-[136px] lg:w-[160px] aspect-[2/3] overflow-hidden rounded-xl bg-surface-2 ring-1 ring-white/[0.06]
                                    group-hover/top:ring-white/25">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={tmdbImage("w342", movie.poster_path)}
                                        srcSet={posterSrcSet(movie.poster_path!)}
                                        sizes={POSTER_CARD_SIZES}
                                        alt=""
                                        loading="lazy"
                                        decoding="async"
                                        referrerPolicy="no-referrer"
                                        className="h-full w-full object-cover"
                                    />
                                    {movie.vote_average ? (
                                        <span className="absolute top-2 right-2 inline-flex items-center gap-0.5 rounded-full bg-black/65 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                                            <Star className="h-2.5 w-2.5 fill-gold text-gold" aria-hidden="true" />
                                            {movie.vote_average.toFixed(1)}
                                        </span>
                                    ) : null}
                                </span>
                            </Link>
                        </li>
                    );
                })}
                {/* trailing spacer so the last poster can snap fully into view */}
                <li aria-hidden="true" className={cn("flex-none w-1")} />
            </ol>
        </section>
    );
}
