"use client";

import React, { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Film, Tv, User, Building2, Layers, SearchX, Search, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import MovieCard from "@/components/MovieCard";
import SearchGrid from "@/components/SearchGrid";
import { CardGridSkeleton } from "@/components/Skeleton";
import type { Movie } from "@/lib/tmdb";
import { normalizeQuery, peekSearch, searchTitles } from "@/lib/searchClient";
import { useSearchInput } from "@/lib/useSearchInput";

const categoryTabs = [
    { id: "all", label: "All", icon: Layers },
    { id: "movie", label: "Movies", icon: Film },
    { id: "tv", label: "TV Shows", icon: Tv },
    { id: "person", label: "People", icon: User },
    { id: "company", label: "Studios", icon: Building2 },
] as const;
type Category = (typeof categoryTabs)[number]["id"];

export interface Genre {
    id: number;
    name: string;
}

interface SearchClientProps {
    // Rendered on the server with the page (no request after it loads)
    trending: Movie[];
    genres: Genre[];
}

// Search box for phones, where the navbar has no room for one
function MobileSearchBox({ query }: { query: string }) {
    const search = useSearchInput();
    const inputRef = useRef<HTMLInputElement>(null);
    const { syncFromUrl } = search;

    useEffect(() => {
        syncFromUrl(query);
    }, [query, syncFromUrl]);

    return (
        <form
            role="search"
            onSubmit={(e) => {
                e.preventDefault();
                search.submit();
                inputRef.current?.blur();
            }}
            className="md:hidden mb-6 flex h-12 items-center gap-2.5 rounded-full border border-line bg-surface-2/80 px-4 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20"
        >
            {search.isPending ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-accent" aria-hidden="true" />
            ) : (
                <Search className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
            )}
            <input
                ref={inputRef}
                type="search"
                enterKeyHint="search"
                autoComplete="off"
                // Opening the Search tab means "I want to type"
                autoFocus={!query}
                aria-label="Search titles, anime, cast"
                placeholder="Search titles, anime, cast..."
                value={search.value}
                onChange={(e) => search.onChange(e.target.value)}
                className="min-w-0 flex-1 bg-transparent text-[15px] text-white placeholder:text-subtle outline-none [&::-webkit-search-cancel-button]:hidden"
            />
            {search.value && (
                <button
                    type="button"
                    onClick={() => {
                        search.onChange("");
                        inputRef.current?.focus();
                    }}
                    className="grid h-8 w-8 place-items-center rounded-full text-muted hover:text-white"
                    aria-label="Clear search"
                >
                    <X className="h-4 w-4" />
                </button>
            )}
        </form>
    );
}

export default function SearchClient({ trending, genres }: SearchClientProps) {
    const searchParams = useSearchParams();
    const query = (searchParams.get("q") || "").trim();
    const q = normalizeQuery(query);

    // Results typed into the navbar a moment ago (or earlier this session) are
    // already in the browser: show them on the first render, with no skeleton
    const known = peekSearch(q);
    const [answer, setAnswer] = useState<{ q: string; items: Movie[] } | null>(null);
    const [failedQuery, setFailedQuery] = useState<string | null>(null);
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        if (!q || peekSearch(q)) return;
        // Drops answers for queries the user has moved on from, so a slow
        // earlier request can never overwrite newer results
        let active = true;
        searchTitles(q)
            .then((items) => {
                if (active) setAnswer({ q, items });
            })
            .catch(() => {
                if (active) setFailedQuery(q);
            });
        return () => {
            active = false;
        };
    }, [q, attempt]);

    const results = known ?? (answer?.q === q ? answer.items : undefined);
    const hasError = !!q && !results && failedQuery === q;
    const isLoading = !!q && !results && !hasError;

    // While the next query loads, the previous results stay on screen (dimmed)
    // instead of blinking to a skeleton on every keystroke
    const [previous, setPrevious] = useState<Movie[] | undefined>(undefined);
    if (results && results !== previous) setPrevious(results);
    const shown = results ?? (isLoading ? previous : undefined);

    // The category filter resets for each new query
    const [category, setCategory] = useState<{ q: string; id: Category }>({ q: "", id: "all" });
    const activeCategory: Category = category.q === q ? category.id : "all";

    const counts: Record<Category, number> = { all: 0, movie: 0, tv: 0, person: 0, company: 0 };
    for (const item of shown ?? []) {
        counts.all++;
        if (item.media_type in counts) counts[item.media_type as Category]++;
    }
    const filteredResults = activeCategory === "all"
        ? shown ?? []
        : (shown ?? []).filter((item) => item.media_type === activeCategory);

    return (
        <>
            <MobileSearchBox query={query} />

            <header className="mb-8 md:mb-10">
                <p className="eyebrow mb-3 text-accent">{query ? "Search results" : "Search"}</p>
                <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-[-0.03em] text-white truncate max-w-full pb-1">
                    {query ? <>&ldquo;{query}&rdquo;</> : "What do you want to watch?"}
                </h1>
                {query ? (
                    <p className="mt-3 flex h-5 items-center gap-2 text-sm text-muted" role="status" aria-live="polite">
                        {isLoading ? (
                            <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" aria-hidden="true" />
                                Searching…
                            </>
                        ) : results ? (
                            `${results.length} ${results.length === 1 ? "result" : "results"}`
                        ) : null}
                    </p>
                ) : (
                    <p className="mt-3 text-[15px] text-muted">
                        Search movies, shows, people and studios
                        <span className="hidden md:inline"> from the search bar — press <kbd className="mx-0.5 rounded-md border border-line bg-white/[0.06] px-1.5 py-0.5 font-sans text-xs text-gray-300">/</kbd> to jump to it</span>.
                    </p>
                )}
            </header>

            {hasError ? (
                <div role="alert" className="surface flex flex-col items-center justify-center px-6 py-24 text-center">
                    <p className="font-display text-xl font-bold text-white">Search isn&apos;t responding right now</p>
                    <p className="mt-1 text-sm text-muted">Check your connection and try again.</p>
                    <button type="button" onClick={() => setAttempt((n) => n + 1)} className="btn btn-sm btn-ghost mt-6">
                        Try again
                    </button>
                </div>
            ) : shown && shown.length > 0 ? (
                <div className={cn("space-y-8", isLoading && "opacity-60")} aria-busy={isLoading}>
                    {/* Category filter */}
                    <div role="tablist" aria-label="Filter results" className="flex items-center gap-2 overflow-x-auto scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0 pb-1">
                        {categoryTabs.map(({ id, label, icon: Icon }) => {
                            if (id !== "all" && counts[id] === 0) return null;
                            const active = activeCategory === id;
                            return (
                                <button
                                    key={id}
                                    role="tab"
                                    aria-selected={active}
                                    onClick={() => setCategory({ q, id })}
                                    className={cn("chip shrink-0", active && "chip-active")}
                                >
                                    <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                                    {label}
                                    <span className={cn(
                                        "rounded-full px-1.5 text-[11px] font-semibold tabular-nums",
                                        active ? "bg-ink/10 text-ink" : "bg-white/[0.08] text-muted"
                                    )}>
                                        {counts[id]}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {filteredResults.length > 0 ? (
                        <SearchGrid results={filteredResults} />
                    ) : (
                        <div className="surface flex flex-col items-center justify-center px-6 py-20 text-center">
                            <p className="font-display text-lg font-bold text-white">No results in this category</p>
                            <p className="mt-1 text-sm text-muted">Try checking the other tabs for matches.</p>
                        </div>
                    )}
                </div>
            ) : isLoading ? (
                <CardGridSkeleton count={15} label="Loading results" />
            ) : !query ? (
                <div className="space-y-12">
                    {/* Top Genres */}
                    {genres.length > 0 && (
                        <section aria-labelledby="search-genres">
                            <h2 id="search-genres" className="eyebrow mb-4 font-sans">Browse by genre</h2>
                            <div className="flex flex-wrap gap-2">
                                {genres.map((genre) => (
                                    <Link
                                        key={genre.id}
                                        href={`/categories/${genre.id}?name=${encodeURIComponent(genre.name)}&type=movie`}
                                        prefetch={false}
                                        className="chip h-10 px-5"
                                    >
                                        {genre.name}
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Trending Now */}
                    {trending.length > 0 && (
                        <section aria-labelledby="search-trending">
                            <h2 id="search-trending" className="mb-4 font-display text-xl md:text-[22px] font-bold text-white">Trending today</h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-3 gap-y-5 sm:gap-x-4 sm:gap-y-6">
                                {trending.map((item) => (
                                    <MovieCard key={`${item.id}-${item.media_type}`} movie={item} isFluid={true} />
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            ) : (
                <div className="surface flex flex-col items-center justify-center px-6 py-24 text-center">
                    <div className="mb-5 grid h-14 w-14 place-items-center rounded-full bg-white/[0.05] ring-1 ring-white/10">
                        <SearchX className="h-6 w-6 text-subtle" aria-hidden="true" />
                    </div>
                    <p className="font-display text-xl font-bold text-white">
                        No matches for &ldquo;{query}&rdquo;
                    </p>
                    <p className="mt-1 max-w-sm text-sm text-muted">
                        Check the spelling, or try a title, an actor&apos;s name or a studio.
                    </p>
                </div>
            )}
        </>
    );
}
