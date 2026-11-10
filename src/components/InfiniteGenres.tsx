"use client";

import React, { useState, useEffect, useRef } from "react";
import { getJSON } from "@/lib/api";
import MovieRow from "./MovieRow";
import type { Movie } from "@/lib/tmdb";
import { MovieRowSkeleton } from "./Skeleton";

type GenreRowData = {
    title: string;
    movies: Movie[];
};

interface InfiniteGenresProps {
    type?: "all" | "movie" | "tv";
}

// Consecutive failed requests before we stop asking (TMDB or the server is down)
const MAX_FAILURES = 3;

const InfiniteGenres = ({ type = "all" }: InfiniteGenresProps) => {
    const [rows, setRows] = useState<GenreRowData[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [failures, setFailures] = useState(0);
    const observerTarget = useRef<HTMLDivElement>(null);

    // Total genres available in actions.ts:
    // all: 13, movie: 11, tv: 10
    const TOTAL_GENRES = type === "all" ? 13 : type === "movie" ? 11 : 10;
    const canLoad = hasMore && failures < MAX_FAILURES;

    const loadMoreGenres = async () => {
        if (isLoading || !canLoad) return;
        setIsLoading(true);

        try {
            // Load 2 genres at a time to keep it extremely smooth and responsive.
            // A cacheable GET: the CDN answers it, and it doesn't queue behind
            // (or block) other requests the way a server action would.
            const nextRows = await getJSON<GenreRowData[]>(`/api/genres?type=${type}&start=${currentIndex}&limit=2`);

            // A genre with no titles (or a TMDB hiccup for it) is skipped; it
            // must not end the list for every genre after it
            if (nextRows.length > 0) setRows((prev) => [...prev, ...nextRows]);
            const nextIndex = currentIndex + 2;
            setCurrentIndex(nextIndex);
            setFailures(0);
            if (nextIndex >= TOTAL_GENRES) setHasMore(false);
        } catch (error) {
            console.error("Failed to load more genres:", error);
            // Wait before the observer below retries the same genres
            await new Promise((resolve) => setTimeout(resolve, 2000));
            setFailures((f) => f + 1);
        } finally {
            setIsLoading(false);
        }
    };

    const loadMoreRef = useRef(loadMoreGenres);
    loadMoreRef.current = loadMoreGenres;

    // Re-created after every batch: observe() reports the target's current
    // position, so if the new rows didn't push it out of range the next batch
    // starts straight away instead of waiting for another scroll. Rows load
    // well before they are reached, so they never pop in under the reader.
    useEffect(() => {
        if (!canLoad || isLoading) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    loadMoreRef.current();
                }
            },
            { rootMargin: "0px 0px 1200px 0px" }
        );

        const currentTarget = observerTarget.current;
        if (currentTarget) {
            observer.observe(currentTarget);
        }

        return () => observer.disconnect();
    }, [canLoad, isLoading, currentIndex]);

    return (
        <div className="space-y-10 md:space-y-14">
            {/* Loaded rows */}
            {rows.map((row) => (
                <MovieRow
                    key={row.title}
                    title={row.title}
                    movies={row.movies}
                />
            ))}

            {/* Intersection target & loading skeleton. The skeleton stays while
                more rows are coming (not just during a request), so the footer
                doesn't jump each time a batch starts and ends. */}
            <div ref={observerTarget} className="w-full pb-8">
                {canLoad && <MovieRowSkeleton />}

                {!hasMore && rows.length > 0 && (
                    <div className="page-gutter flex items-center gap-4 py-6 text-xs font-medium uppercase tracking-[0.18em] text-subtle">
                        <span className="h-px flex-1 bg-line" aria-hidden="true" />
                        You&apos;re all caught up
                        <span className="h-px flex-1 bg-line" aria-hidden="true" />
                    </div>
                )}
            </div>
        </div>
    );
};

export default InfiniteGenres;
