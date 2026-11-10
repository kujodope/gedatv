"use client";

import React, { useEffect } from "react";
import MovieCard from "@/components/MovieCard";
import { selectData, useHydrated, useLibrary } from "@/lib/library";
import { toListMovie } from "@/lib/myList";
import type { Movie } from "@/lib/tmdb";
import { Plus, Bookmark } from "lucide-react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { Skeleton } from "@/components/Skeleton";

export default function WatchlistPage() {
    // The active profile's list; updates live when it changes here or in another tab
    const watchlist = useLibrary((s) => selectData(s).watchlist);
    const hydrated = useHydrated();

    useEffect(() => {
        document.title = "My List | GedaTv";
    }, []);

    const movies: Movie[] = watchlist.map(toListMovie);

    const movieTotal = movies.filter((m) => m.media_type === "movie").length;
    const tvTotal = movies.filter((m) => m.media_type === "tv").length;

    return (
        <main className="min-h-screen pb-16">
            <div className="page-top page-gutter">
                <PageHeader
                    eyebrow="Your library"
                    title="My List"
                    description={movies.length > 0
                        ? "Everything you've saved to watch later, newest first."
                        : undefined}
                    aside={movies.length > 0 ? (
                        <dl className="flex items-center gap-6 text-sm">
                            <div><dt className="text-muted">Movies</dt><dd className="font-display text-2xl font-bold text-white tabular-nums">{movieTotal}</dd></div>
                            <div><dt className="text-muted">Series</dt><dd className="font-display text-2xl font-bold text-white tabular-nums">{tvTotal}</dd></div>
                        </dl>
                    ) : undefined}
                />

                {!hydrated ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-3 gap-y-5 sm:gap-x-4 sm:gap-y-6" aria-hidden="true">
                        {Array.from({ length: 10 }, (_, i) => <Skeleton key={i} className="aspect-[2/3] w-full rounded-2xl" />)}
                    </div>
                ) : movies.length === 0 ? (
                    <div
                        className="surface flex flex-col items-center justify-center px-6 py-20 md:py-28 text-center"
                    >
                        <div className="mb-6 grid h-16 w-16 place-items-center rounded-2xl bg-accent-soft ring-1 ring-accent/30">
                            <Bookmark className="h-7 w-7 text-accent" aria-hidden="true" />
                        </div>
                        <h2 className="font-display text-2xl font-bold text-white">Your list is empty</h2>
                        <p className="mt-2 max-w-md text-[15px] text-muted">
                            Tap <Plus className="inline h-4 w-4 -mt-0.5" aria-label="the plus button" /> on any movie or show to save it here for later.
                        </p>
                        <div className="mt-8 flex flex-wrap justify-center gap-3">
                            <Link href="/movies" className="btn btn-primary">Browse movies</Link>
                            <Link href="/tv" className="btn btn-ghost">Browse TV shows</Link>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-3 gap-y-5 sm:gap-x-4 sm:gap-y-6">
                        {movies.map((movie) => (
                            <MovieCard key={`${movie.id}-${movie.media_type}`} movie={movie} isFluid={true} />
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
