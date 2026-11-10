"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Play, Plus, Check, Info, X, User, Building2, Star, Heart, Film } from "lucide-react";
import type { Movie } from "@/lib/tmdb";
import { cn } from "@/lib/utils";
import { tmdbImage, posterSrcSet, backdropSrcSet, GRID_CARD_SIZES, ROW_CARD_SIZES, ROW_CARD_WIDTH } from "@/lib/images";
import { lib, toTitleRef } from "@/lib/library";
import { isInMyList, setInMyList } from "@/lib/myList";

interface MovieCardProps {
    movie: Movie;
    className?: string;
    isFluid?: boolean;
    isResume?: boolean;
    onRemove?: (id: string, type: string) => void;
    loadImage?: boolean;
    aspectRatio?: "portrait" | "landscape";
    isFirst?: boolean;
    isLast?: boolean;
}


export default function MovieCard({
    movie,
    className,
    isFluid = false,
    isResume = false,
    onRemove,
    loadImage = true,
    aspectRatio = "portrait"
}: MovieCardProps) {
    const router = useRouter();
    const [inWatchlist, setInWatchlist] = useState(false);
    const [isFav, setIsFav] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [isNavigating, setIsNavigating] = useState(false);
    // Prefetch the title page only once someone shows interest (hover, focus,
    // touch). Prefetching every card that scrolled into view sent ~200 route
    // requests per homepage scroll, competing with the posters for bandwidth.
    const [wantsPrefetch, setWantsPrefetch] = useState(false);
    const linkPrefetch = wantsPrefetch ? null : false;
    const showIntent = () => setWantsPrefetch(true);

    const isPerson = movie.media_type === "person";
    const isCompany = movie.media_type === "company";
    const mediaType = (movie.media_type as "movie" | "tv") || "movie";
    const movieIdStr = String(movie.id);

    const [isWatchedTogether, setIsWatchedTogether] = useState(false);

    // Initial lightweight check for watched-together badge
    useEffect(() => {
        setIsWatchedTogether(lib.isTogether(mediaType, movieIdStr));
    }, [movieIdStr, mediaType]);

    // Fast check for watchlist and favourites on hover / interaction
    const ensureActionState = () => {
        setInWatchlist(isInMyList(mediaType, movieIdStr));
        setIsFav(lib.has("favourites", mediaType, movieIdStr));
    };

    const title = movie.title || movie.name || "Untitled";
    const year = (movie.release_date || movie.first_air_date)?.split("-")[0];
    const rating = movie.vote_average && movie.vote_average > 0 ? movie.vote_average.toFixed(1) : null;

    // Artwork paths
    const posterPath = movie.poster_path;
    const backdropPath = movie.backdrop_path;
    const artPath = isPerson
        ? movie.profile_path
        : isCompany
            ? movie.logo_path
            : (aspectRatio === "portrait" ? (posterPath || backdropPath) : (backdropPath || posterPath));

    const imageUrl = isCompany
        ? tmdbImage("w300", artPath)
        : isPerson
            ? tmdbImage("w342", artPath)
            : (aspectRatio === "portrait" ? tmdbImage("w342", artPath) : tmdbImage("w500", artPath));

    // Without sizes the browser assumes 100vw and fetches the largest file
    const imageSizes = isFluid
        ? GRID_CARD_SIZES
        : isPerson || isCompany
            ? "(min-width: 768px) 170px, (min-width: 640px) 150px, 130px"
            : ROW_CARD_SIZES;

    const imageSrcSet = !artPath || isCompany
        ? undefined
        : (aspectRatio === "portrait" || isPerson ? posterSrcSet(artPath) : backdropSrcSet(artPath));

    const watchUrl = `/watch/${mediaType}/${movie.id}${movie.season ? `?s=${movie.season}&e=${movie.episode || 1}` : ""}`;
    const playUrl = `${watchUrl}${watchUrl.includes("?") ? "&" : "?"}resume=true`;
    const detailsUrl = watchUrl;

    const cardUrl = isPerson
        ? `/person/${movie.id}`
        : isCompany
            ? `/company/${movie.id}`
            : (isResume ? playUrl : detailsUrl);

    const handlePlayClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsNavigating(true);
        router.push(playUrl);
    };

    const handleWatchlistClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const titleRef = toTitleRef(movie);
        if (!titleRef) return;
        setInMyList(titleRef, !inWatchlist);
        setInWatchlist(!inWatchlist);
    };

    const handleFavouriteClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const titleRef = toTitleRef(movie);
        if (titleRef) {
            setIsFav(lib.toggle("favourites", titleRef));
        }
    };

    const handleRemoveClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onRemove?.(movieIdStr, mediaType);
    };

    // Special layout for Persons & Companies
    if (isPerson || isCompany) {
        return (
            <div
                className={cn(
                    "group/card relative flex flex-col items-center text-center",
                    isFluid ? "w-full" : "flex-none w-[130px] sm:w-[150px] md:w-[170px]",
                    className
                )}
                onMouseEnter={showIntent}
                onFocus={showIntent}
                onTouchStart={showIntent}
            >
                <Link
                    href={cardUrl}
                    prefetch={linkPrefetch}
                    className="relative w-full aspect-square rounded-2xl bg-surface-2 border border-line overflow-hidden p-3 flex items-center justify-center group-hover/card:border-accent/40"
                >
                    {artPath && loadImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={imageUrl}
                            srcSet={imageSrcSet}
                            sizes={imageSizes}
                            alt={title}
                            loading="lazy"
                            decoding="async"
                            className={cn(
                                "object-cover",
                                isPerson ? "h-full w-full rounded-xl" : "max-h-full max-w-full object-contain filter invert opacity-90"
                            )}
                        />
                    ) : (
                        <div className="text-muted">
                            {isPerson ? <User className="w-8 h-8" /> : <Building2 className="w-8 h-8" />}
                        </div>
                    )}
                </Link>
                <Link href={cardUrl} prefetch={linkPrefetch} className="mt-2 text-xs font-semibold text-white hover:text-accent truncate w-full">
                    {title}
                </Link>
                {movie.known_for_department && (
                    <span className="text-[10px] text-muted">{movie.known_for_department}</span>
                )}
            </div>
        );
    }

    return (
        <div
            className={cn(
                "group/card relative flex flex-col",
                isFluid ? "w-full" : ROW_CARD_WIDTH,
                className
            )}
            onMouseEnter={() => {
                setIsHovered(true);
                showIntent();
                ensureActionState();
            }}
            onMouseLeave={() => setIsHovered(false)}
            // Keyboard users get the same quick actions as mouse users
            onFocus={() => {
                showIntent();
                if (!isHovered) {
                    setIsHovered(true);
                    ensureActionState();
                }
            }}
            onTouchStart={showIntent}
            onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setIsHovered(false);
            }}
        >
            {/* Poster Card Surface */}
            <div
                className={cn(
                    "relative w-full aspect-[2/3] rounded-xl overflow-hidden bg-surface-2 ring-1 ring-white/10",
                    "group-hover/card:ring-white/30"
                )}
            >
                {/* Poster Artwork */}
                {artPath && loadImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={imageUrl}
                        srcSet={imageSrcSet}
                        sizes={imageSizes}
                        alt={title}
                        loading="lazy"
                        decoding="async"
                        className="absolute inset-0 h-full w-full object-cover"
                    />
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-gradient-to-b from-surface-2 to-surface-3 text-center">
                        <Film className="w-8 h-8 text-subtle mb-2" />
                        <span className="text-xs font-bold text-muted line-clamp-2">{title}</span>
                    </div>
                )}

                {/* Rating Badge (top-left) */}
                {rating && isHovered && (
                    <div className="absolute top-2 left-2 z-30 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/70 border border-white/10 text-[11px] font-bold text-white">
                        <Star className="w-3 h-3 text-gold fill-gold" />
                        <span>{rating}</span>
                    </div>
                )}

                {/* Watched Together Badge (top-right) */}
                {isWatchedTogether && (
                    <div
                        className={cn(
                            "absolute bottom-2 left-2 z-20 grid place-items-center h-6 w-6 rounded-full bg-black/70 text-white",
                            onRemove && "left-2"
                        )}
                        title="Watched together"
                    >
                        <Heart className="w-3.5 h-3.5 fill-white" />
                    </div>
                )}

                {/* Remove button if inside history/list row */}
                {onRemove && (
                    <button
                        type="button"
                        onClick={handleRemoveClick}
                        className="absolute top-2 right-2 z-30 grid h-7 w-7 place-items-center rounded-full bg-black/70 backdrop-blur-md ring-1 ring-white/15 text-white hover:bg-white hover:text-black cursor-pointer pointer-events-auto"
                        title="Remove from continue watching"
                        aria-label="Remove"
                    >
                        <X className="w-3.5 h-3.5 pointer-events-none" />
                    </button>
                )}

                {/* Primary Card Link for direct click */}
                <Link
                    href={cardUrl}
                    prefetch={linkPrefetch}
                    className="absolute inset-0 z-10"
                    aria-label={`View ${title}`}
                />

                {/* Desktop Hover Overlay with Action Buttons — Only mounted on hover for high-performance rendering */}
                {isHovered && (
                    <div
                        className="absolute inset-0 z-20 flex flex-col justify-end p-3.5 bg-gradient-to-t from-ink via-ink/60 to-transparent pointer-events-none"
                    >
                        <div className="flex items-center justify-between gap-1.5 pt-2 pointer-events-auto">
                            {/* Play Now Button */}
                            <button
                                onClick={handlePlayClick}
                                className="grid place-items-center h-10 w-10 rounded-full bg-white text-black"
                                title="Watch Now"
                                aria-label={`Play ${title}`}
                            >
                                <Play className="h-4 w-4 fill-black translate-x-0.5" />
                            </button>

                            <div className="flex items-center gap-1.5">
                                {/* Favourites Heart Button */}
                                <button
                                    onClick={handleFavouriteClick}
                                    className={cn(
                                        "grid place-items-center h-9 w-9 rounded-full border border-line-strong",
                                        isFav ? "bg-white border-white text-black" : "bg-black/60 text-white hover:border-white"
                                    )}
                                    title={isFav ? "Remove from favourites" : "Add to favourites"}
                                    aria-label={isFav ? `Remove ${title} from favourites` : `Add ${title} to favourites`}
                                    aria-pressed={isFav}
                                >
                                    <Heart className={cn("h-4 w-4", isFav && "fill-black")} />
                                </button>

                                {/* Watchlist Plus Button */}
                                <button
                                    onClick={handleWatchlistClick}
                                    className={cn(
                                        "grid place-items-center h-9 w-9 rounded-full border border-line-strong",
                                        inWatchlist ? "bg-white border-white text-black" : "bg-black/60 text-white hover:border-white"
                                    )}
                                    title={inWatchlist ? "Remove from My List" : "Add to My List"}
                                    aria-label={inWatchlist ? `Remove ${title} from My List` : `Add ${title} to My List`}
                                    aria-pressed={inWatchlist}
                                >
                                    {inWatchlist ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                                </button>

                                {/* Details Info Button */}
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        router.push(detailsUrl);
                                    }}
                                    className="grid place-items-center h-9 w-9 rounded-full bg-black/60 border border-line-strong text-white hover:border-line-strong"
                                    title="Details"
                                    aria-label={`${title} details`}
                                >
                                    <Info className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Clean posters like the reference; episode info only on resume cards */}
            {movie.season && (
            <div className="mt-2 px-0.5 flex flex-col">
                <Link
                    href={cardUrl}
                    prefetch={linkPrefetch}
                    className="text-[13px] font-medium text-white/90 hover:text-white truncate"
                    title={title}
                >
                    {title}
                </Link>
                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted">
                    {year && <span>{year}</span>}
                    {year && <span className="text-line-strong">•</span>}
                    <span className="uppercase tracking-wider font-semibold">
                        {mediaType === "tv" ? "Series" : "Movie"}
                    </span>
                    {movie.season && (
                        <>
                            <span className="text-line-strong">•</span>
                            <span className="text-white font-semibold">S{movie.season}E{movie.episode || 1}</span>
                        </>
                    )}
                </div>
            </div>
            )}
        </div>
    );
}
