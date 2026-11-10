"use client";

import React, { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Play, Info, Plus, Check, Clapperboard, ChevronLeft, ChevronRight, Star, Heart } from "lucide-react";
import type { Movie } from "@/lib/tmdb";
import { tmdbImage, heroSrcSet } from "@/lib/images";
import { lib, toTitleRef } from "@/lib/library";
import { setInMyList, useInList } from "@/lib/myList";
import { cn } from "@/lib/utils";
import { useReleaseStatus } from "@/lib/release";
import { getJSON } from "@/lib/api";
import TrailerModal from "./TrailerModal";

interface HeroProps {
    movies: Movie[];
    // Context line above the title; the slide's rank is prefixed ("#1 · Trending today")
    label?: string;
    // When the server rendered the page (Date.now()), for hydration-safe release labels
    renderedAt?: number;
}

const Hero = ({ movies, label = "Trending today", renderedAt }: HeroProps) => {
    const router = useRouter();
    // Filter out movies without a backdrop path to prevent blank slides
    const validMovies = useMemo(() => movies.filter(m => m.backdrop_path), [movies]);
    const heroMovies = useMemo(() => validMovies.slice(0, 10), [validMovies]);

    const [current, setCurrent] = useState(0);
    const [trailerUrl, setTrailerUrl] = useState<string | null>(null);
    const [isTrailerLoading, setIsTrailerLoading] = useState(false);
    const [isTrailerModalOpen, setIsTrailerModalOpen] = useState(false);

    const slideCount = heroMovies.length;
    const goTo = useCallback((index: number) => {
        if (!slideCount) return;
        setCurrent(((index % slideCount) + slideCount) % slideCount);
        setTrailerUrl(null); // Reset trailer when movie changes
    }, [slideCount]);

    // No autoplay: slides change only when someone picks one, so nothing
    // moves or downloads on its own after the page loads

    // Live list state for the visible slide (stays in sync with other components and tabs)
    const slide = heroMovies[current] ?? heroMovies[0];
    const slideType = (slide?.media_type as "movie" | "tv") || "movie";
    const inWatchlist = useInList("watchlist", slideType, String(slide?.id ?? ""));
    const isFav = useInList("favourites", slideType, String(slide?.id ?? ""));
    const { isReleased, isRecentRelease } = useReleaseStatus(slide?.release_date || slide?.first_air_date, renderedAt);

    if (!heroMovies.length) return null;

    const movie = heroMovies[current] ?? heroMovies[0];
    const mediaType = (movie.media_type as "movie" | "tv") || "movie";
    const title = movie.title || movie.name || "";
    const year = (movie.release_date || movie.first_air_date)?.split("-")[0];
    const detailsUrl = `/watch/${mediaType}/${movie.id}`;

    const handleWatchlistToggle = () => {
        const titleRef = toTitleRef(movie);
        if (titleRef) setInMyList(titleRef, !inWatchlist);
    };

    const handleFavouriteToggle = () => {
        const titleRef = toTitleRef(movie);
        if (titleRef) lib.toggle("favourites", titleRef);
    };

    const handlePlayTrailer = async () => {
        setIsTrailerLoading(true);
        const url = await getJSON<{ url: string | null }>(`/api/trailer?type=${mediaType}&id=${movie.id}`)
            .then((data) => data.url)
            .catch(() => null);
        setTrailerUrl(url);
        setIsTrailerModalOpen(true);
        setIsTrailerLoading(false);
    };


    return (
        <section
            aria-roledescription="carousel"
            aria-label="Featured titles"
            className="relative w-full overflow-hidden bg-black h-[80svh] min-h-[540px] md:h-[92vh] md:min-h-[620px] max-h-[1000px]"
            onKeyDown={(e) => {
                if (e.target !== e.currentTarget) return;
                if (e.key === "ArrowRight") goTo(current + 1);
                if (e.key === "ArrowLeft") goTo(current - 1);
            }}
        >
            <TrailerModal
                isOpen={isTrailerModalOpen}
                onClose={() => setIsTrailerModalOpen(false)}
                trailerUrl={trailerUrl}
                title={title}
            />

            {/* Artwork */}
            <div
                key={`art-${movie.id}`}
                className="absolute inset-0 cursor-pointer"
                onClick={() => router.push(detailsUrl)}
                aria-hidden="true"
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={tmdbImage("w1280", movie.backdrop_path)}
                    srcSet={heroSrcSet(movie.backdrop_path!)}
                    sizes="100vw"
                    fetchPriority={current === 0 ? "high" : "auto"}
                    decoding="async"
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover object-[center_20%]"
                    referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 scrim-hero" />
            </div>

            {/* Content */}
            <div className="pointer-events-none absolute inset-0 flex flex-col justify-end page-gutter pb-20 sm:pb-24 md:pb-32 lg:pb-36">
                <div
                    key={`content-${movie.id}`}
                    className="pointer-events-auto max-w-[min(42rem,100%)]"
                    aria-live="polite"
                >
                        <p className="sr-only">#{current + 1} {label}</p>

                        {/* Title / Logo */}
                        {movie.logos && (movie.logos as any[]).length > 0 ? (
                            <div className="mb-4 md:mb-5 h-20 sm:h-28 md:h-36 lg:h-40 w-full max-w-[30rem] flex items-end">
                                <h2 className="sr-only">{title}</h2>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={tmdbImage("w500", movie.logos![0].file_path)}
                                    srcSet={`${tmdbImage("w300", movie.logos![0].file_path)} 300w, ${tmdbImage("w500", movie.logos![0].file_path)} 500w`}
                                    sizes="(min-width: 768px) 448px, 300px"
                                    decoding="async"
                                    alt={title}
                                    className="max-h-full max-w-full object-contain object-left-bottom drop-shadow-[0_4px_24px_rgba(0,0,0,0.6)]"
                                />
                            </div>
                        ) : (
                            <h2 className="mb-4 md:mb-5 font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[0.95] tracking-[-0.04em] text-white text-balance text-shadow-lg">
                                {title}
                            </h2>
                        )}

                        {/* Metadata Row */}
                        <div className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] font-semibold text-white">
                            {movie.vote_average ? (
                                <span className="inline-flex items-center gap-1">
                                    <Star className="h-3.5 w-3.5 fill-gold text-gold" aria-hidden="true" />
                                    <span>{movie.vote_average.toFixed(1)}</span>
                                    <span className="sr-only">out of 10</span>
                                </span>
                            ) : null}
                            {movie.vote_average && year ? <span className="text-white/50" aria-hidden="true">•</span> : null}
                            {year && <span>{year}</span>}
                            <span className="text-white/50" aria-hidden="true">•</span>
                            <span>{mediaType === "tv" ? "Series" : "Movie"}</span>
                            {!isReleased && <span className="badge border-accent/60 text-accent">Coming soon</span>}
                        </div>

                        {/* Description */}
                        {movie.overview && (
                            <p className="mb-6 max-w-[34rem] text-sm sm:text-[15px] leading-relaxed text-white/85 line-clamp-3 text-pretty">
                                {movie.overview}
                            </p>
                        )}

                        {/* Buttons */}
                        <div className="flex items-center gap-2">
                            {isReleased ? (
                                <Link
                                    href={`${detailsUrl}?resume=true`}
                                    className="btn btn-sm h-9 px-5 font-semibold btn-primary"
                                >
                                    <Play className="h-4 w-4 fill-current" aria-hidden="true" />
                                    Play
                                </Link>
                            ) : (
                                <button disabled className="btn btn-sm h-9 px-5 btn-primary">
                                    Coming soon
                                </button>
                            )}

                            <Link href={detailsUrl} className="btn btn-sm h-9 px-4 font-medium btn-glass">
                                <Info className="h-4 w-4" aria-hidden="true" />
                                <span className="sm:hidden">Info</span>
                                <span className="hidden sm:inline">More info</span>
                            </Link>

                            <button
                                onClick={handlePlayTrailer}
                                disabled={isTrailerLoading}
                                className="btn-icon btn-glass h-9 w-9"
                                aria-label={`Watch the ${title} trailer`}
                                title="Trailer"
                            >
                                {isTrailerLoading ? (
                                    <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" aria-hidden="true" />
                                ) : (
                                    <Clapperboard className="h-4 w-4" aria-hidden="true" />
                                )}
                            </button>

                            <button
                                onClick={handleFavouriteToggle}
                                aria-pressed={isFav}
                                aria-label={isFav ? `Remove ${title} from favourites` : `Add ${title} to favourites`}
                                title={isFav ? "Remove from favourites" : "Add to our favourites"}
                                className={cn(
                                    "btn-icon btn-glass h-9 w-9",
                                    isFav && "bg-white border-white text-black"
                                )}
                            >
                                <Heart className={cn("h-4 w-4", isFav && "fill-black")} />
                            </button>

                            <button
                                onClick={handleWatchlistToggle}
                                aria-pressed={inWatchlist}
                                aria-label={inWatchlist ? `Remove ${title} from My List` : `Add ${title} to My List`}
                                title={inWatchlist ? "Remove from My List" : "Add to My List"}
                                className={cn(
                                    "btn-icon btn-glass h-9 w-9",
                                    inWatchlist && "bg-white border-white text-black hover:bg-white/90"
                                )}
                            >
                                {inWatchlist ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                            </button>
                        </div>


                        {isRecentRelease && (
                            <p className="mt-3 text-xs text-gray-400">
                                Released recently — if it isn&apos;t available yet, check back a little later.
                            </p>
                        )}
                    </div>
            </div>

            {/* Slide controls */}
            {slideCount > 1 && (
                <div className="absolute bottom-8 md:bottom-12 inset-x-0 page-gutter flex items-center justify-between gap-4 pointer-events-none">
                    <div className="flex items-center gap-1.5 pointer-events-auto" role="tablist" aria-label="Choose featured title">
                        {heroMovies.map((m, index) => (
                            <button
                                key={m.id}
                                role="tab"
                                aria-selected={current === index}
                                aria-label={`${index + 1}: ${m.title || m.name}`}
                                onClick={() => goTo(index)}
                                className="group/dot relative h-6 flex items-center"
                            >
                                <span className={cn(
                                    "block h-[3px] rounded-full",
                                    current === index ? "w-8 bg-white" : "w-8 bg-white/20 group-hover/dot:bg-white/40"
                                )} />
                            </button>
                        ))}
                    </div>
                    <div className="hidden md:flex items-center gap-2 pointer-events-auto">
                        <button onClick={() => goTo(current - 1)} className="btn-icon btn-glass h-9 w-9" aria-label="Previous title">
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button onClick={() => goTo(current + 1)} className="btn-icon btn-glass h-9 w-9" aria-label="Next title">
                            <ChevronRight className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            )}
        </section>
    );
};

export default Hero;
