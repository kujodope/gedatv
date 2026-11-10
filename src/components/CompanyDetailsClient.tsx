"use client";

import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, MapPin, Globe, Film, Tv, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Movie } from "@/lib/tmdb";
import { TMDB_CONFIG } from "@/lib/tmdbConfig";
import MovieCard from "./MovieCard";
import { cn } from "@/lib/utils";
import { getJSON } from "@/lib/api";

interface CompanyDetailsClientProps {
    company: any;
    movies: Movie[];
    tvShows: Movie[];
    backdropUrl: string | null;
    moviesTotalResults?: number;
    tvShowsTotalResults?: number;
    moviesTotalPages?: number;
    tvShowsTotalPages?: number;
}

export default function CompanyDetailsClient({
    company,
    movies,
    tvShows,
    backdropUrl,
    moviesTotalResults = 0,
    tvShowsTotalResults = 0,
    moviesTotalPages = 1,
    tvShowsTotalPages = 1,
}: CompanyDetailsClientProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<"movie" | "tv">("movie");
    const [loadedMovies, setLoadedMovies] = useState<Movie[]>(movies);
    const [loadedTvShows, setLoadedTvShows] = useState<Movie[]>(tvShows);
    const [moviePage, setMoviePage] = useState(1);
    const [tvPage, setTvPage] = useState(1);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const observerTarget = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setLoadedMovies(movies);
        setLoadedTvShows(tvShows);
        setMoviePage(1);
        setTvPage(1);
    }, [company.id, movies, tvShows]);

    const handleLoadMore = async () => {
        if (isLoadingMore) return;
        setIsLoadingMore(true);

        const nextPage = activeTab === "movie" ? moviePage + 1 : tvPage + 1;

        try {
            const data = await getJSON<{ results: Movie[] }>(`/api/discover?company=${company.id}&type=${activeTab}&page=${nextPage}`);
            if (data && data.results && data.results.length > 0) {
                if (activeTab === "movie") {
                    setLoadedMovies((prev) => {
                        const existingIds = new Set(prev.map(item => item.id));
                        const uniqueNew = data.results.filter(item => !existingIds.has(item.id));
                        return [...prev, ...uniqueNew];
                    });
                    setMoviePage(nextPage);
                } else {
                    setLoadedTvShows((prev) => {
                        const existingIds = new Set(prev.map(item => item.id));
                        const uniqueNew = data.results.filter(item => !existingIds.has(item.id));
                        return [...prev, ...uniqueNew];
                    });
                    setTvPage(nextPage);
                }
            }
        } catch (error) {
            console.error("Failed to load more:", error);
        } finally {
            setIsLoadingMore(false);
        }
    };

    const displayedItems = activeTab === "movie" ? loadedMovies : loadedTvShows;
    const totalResults = activeTab === "movie" ? (moviesTotalResults || movies.length) : (tvShowsTotalResults || tvShows.length);
    const totalPages = activeTab === "movie" ? (moviesTotalPages || 1) : (tvShowsTotalPages || 1);
    const currentPage = activeTab === "movie" ? moviePage : tvPage;
    const hasMore = currentPage < totalPages && displayedItems.length < totalResults;
    const displayedTotalResults = hasMore ? totalResults : displayedItems.length;

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
                    handleLoadMore();
                }
            },
            { threshold: 0.1, rootMargin: "300px" }
        );

        const currentTarget = observerTarget.current;
        if (currentTarget) {
            observer.observe(currentTarget);
        }

        return () => {
            if (currentTarget) {
                observer.unobserve(currentTarget);
            }
        };
    }, [activeTab, moviePage, tvPage, hasMore, isLoadingMore]);

    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-accent selection:text-black">
            {/* Fixed Back Button at Top Left */}
            <button
                onClick={() => router.back()}
                className="fixed top-4 left-4 md:top-6 md:left-8 z-[100] btn-icon bg-black/45 hover:bg-black/70 group" aria-label="Go back"
                title="Go Back"
            >
                <ArrowLeft className="w-5 h-5" />
            </button>
            {/* Cinematic Hero Backdrop */}
            <div className="relative w-full min-h-[20vh] sm:min-h-[25vh] md:min-h-[30vh] overflow-hidden flex items-end">
                <div className="absolute inset-0 z-0">
                    {backdropUrl ? (
                        <img
                            src={backdropUrl}
                            alt={company.name}
                            decoding="async"
                            className="w-full h-full object-cover opacity-35 blur-[2px] scale-105"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-900/20 via-black to-black" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-transparent" />
                </div>

                <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-8 md:px-12 pb-4 pt-12">
                    <div className="flex flex-col md:flex-row gap-4 sm:gap-6 md:gap-8 items-center md:items-end text-center md:text-left">
                        {/* Company Logo Display */}
                        <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-36 md:h-36 bg-white/90 p-3 rounded-2xl flex items-center justify-center shadow-2xl border border-white/20">
                            {company.logo_path ? (
                                <img
                                    src={`${TMDB_CONFIG.imageBase}/w300${company.logo_path}`}
                                    alt={company.name}
                                    decoding="async"
                                    className="max-w-full max-h-full object-contain"
                                />
                            ) : (
                                <Film className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" />
                            )}
                        </div>

                        {/* Company Info */}
                        <div className="flex-1 space-y-3 sm:space-y-4">
                            <span className="text-accent text-[10px] sm:text-xs font-black uppercase tracking-[0.3em]">
                                Production Studio
                            </span>
                            
                            <div className="flex items-center justify-center md:justify-start gap-4">
                                <h1 className="text-2xl sm:text-4xl md:text-6xl font-black tracking-tight text-white leading-none">
                                    {company.name}
                                </h1>
                            </div>

                            {/* Metadata */}
                            <div className="flex flex-wrap gap-2.5 sm:gap-4 items-center justify-center md:justify-start text-xs sm:text-sm text-gray-300">
                                {company.headquarters && (
                                    <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border border-white/10">
                                        <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent" />
                                        <span>{company.headquarters}</span>
                                    </div>
                                )}
                                {company.origin_country && (
                                    <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border border-white/10">
                                        <span className="text-[9px] sm:text-[10px] font-black uppercase text-gray-400">Country:</span>
                                        <span className="font-bold">{company.origin_country}</span>
                                    </div>
                                )}
                                {company.homepage && (
                                    <a
                                        href={company.homepage}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border border-white/10 hover:border-accent/50 text-accent font-semibold"
                                    >
                                        <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                        <span>Website</span>
                                        <ExternalLink className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter Tabs and content Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-8 md:px-12 mt-4">
                {/* Custom sliding tabs */}
                <div className="flex justify-center md:justify-start border-b border-white/10 pb-4 mb-6 sm:mb-8">
                    <div className="flex w-full sm:w-auto gap-2 p-1.5 bg-white/5 rounded-xl sm:rounded-2xl border border-white/5">
                        <button
                            onClick={() => setActiveTab("movie")}
                            className={cn(
                                "flex-1 sm:flex-initial relative px-4 py-2 sm:px-6 sm:py-2.5 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm tracking-wide flex items-center justify-center gap-1.5 sm:gap-2",
                                activeTab === "movie" ? "text-ink bg-white" : "text-gray-400 hover:text-white"
                            )}
                        >
                            <Film className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            <span>Movies</span>
                            <span className={cn(
                                "text-[10px] sm:text-xs rounded-md px-1.5 py-0.5 font-bold",
                                activeTab === "movie" ? "bg-black/15 text-black" : "bg-white/10 text-gray-400"
                            )}>
                                {moviesTotalResults || movies.length}
                            </span>
                        </button>

                        <button
                            onClick={() => setActiveTab("tv")}
                            className={cn(
                                "flex-1 sm:flex-initial relative px-4 py-2 sm:px-6 sm:py-2.5 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm tracking-wide flex items-center justify-center gap-1.5 sm:gap-2",
                                activeTab === "tv" ? "text-ink bg-white" : "text-gray-400 hover:text-white"
                            )}
                        >
                            <Tv className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            <span>TV Shows</span>
                            <span className={cn(
                                "text-[10px] sm:text-xs rounded-md px-1.5 py-0.5 font-bold",
                                activeTab === "tv" ? "bg-black/15 text-black" : "bg-white/10 text-gray-400"
                            )}>
                                {tvShowsTotalResults || tvShows.length}
                            </span>
                        </button>
                    </div>
                </div>

                {/* Staggered Grid Content */}
                <>
                    <div
                        key={activeTab}
                    >
                        {displayedItems.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-3 gap-y-5 sm:gap-x-4 sm:gap-y-6">
                                {displayedItems.map((item) => (
                                    <MovieCard key={`${item.id}-${item.media_type}`} movie={item} isFluid={true} />
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-24 text-gray-500">
                                <Film className="w-16 h-16 mb-4 stroke-[1.5] text-gray-600" />
                                <p className="text-lg font-semibold">No {activeTab === "movie" ? "movies" : "TV shows"} found</p>
                                <p className="text-sm text-gray-600">This studio hasn't released any cataloged {activeTab === "movie" ? "movies" : "TV shows"} on TMDB.</p>
                            </div>
                        )}
                    </div>
                </>

                {/* Infinite Scroll Sentinel / Indicator */}
                {displayedItems.length > 0 && (
                    <div ref={observerTarget} className="w-full flex justify-center py-12 border-t border-white/5 mt-16">
                        {hasMore && (
                            <div
                                className="w-8 h-8 border-3 border-white/20 border-t-accent rounded-full animate-spin"
                            />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
