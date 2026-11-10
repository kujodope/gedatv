import React, { useState } from "react";
import { TMDB_CONFIG } from "@/lib/tmdb";
import { tmdbImage, heroSrcSet } from "@/lib/images";
import { Play, Plus, Share2, Check, Clapperboard, Instagram, Twitter, Facebook, Youtube, Globe, Star, Heart, Sparkles } from "lucide-react";
import { lib, toTitleRef, useLibrary } from "@/lib/library";
import { setInMyList, useInList } from "@/lib/myList";
import { cn } from "@/lib/utils";
import { useReleaseStatus } from "@/lib/release";
import Dropdown from "@/components/ui/Dropdown";
import TrailerModal from "@/components/TrailerModal";

const Tiktok = (props: React.ComponentProps<"svg">) => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
    >
        <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
);

interface VideoResult {
    type: string;
    site: string;
    key: string;
}

interface SeasonData {
    season_number: number;
    name?: string;
}

interface ReleaseDateResult {
    iso_3166_1: string;
    release_dates?: Array<{ certification: string }>;
}

interface ContentRatingResult {
    iso_3166_1: string;
    rating?: string;
}

interface LogoImage {
    iso_639_1: string;
    file_path: string;
}

interface DetailsHeroProps {
    tmdbData: any;
    type: "movie" | "tv";
    onPlay: () => void;
    currentSeason: number;
    onSeasonChange: (season: number) => void;
    currentEpisode: number;
    // When the server rendered the page (Date.now()), for hydration-safe release labels
    renderedAt?: number;
}

const formatRuntime = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const DetailsHero = ({ tmdbData, type, onPlay, currentSeason, onSeasonChange, currentEpisode, renderedAt }: DetailsHeroProps) => {
    const [copied, setCopied] = useState(false);
    const [showTrailer, setShowTrailer] = useState(false);

    const titleIdStr = String(tmdbData?.id || "");
    const title = tmdbData.title || tmdbData.name || "";

    const trailer = tmdbData.videos?.results?.find((v: VideoResult) => v.type === "Trailer" && v.site === "YouTube") ||
        tmdbData.videos?.results?.find((v: VideoResult) => v.type === "Teaser" && v.site === "YouTube");

    // Couple library: watched together check
    const isWatchedTogether = useLibrary((s) =>
        s.couple.together.some((i) => i.id === titleIdStr && i.type === type && i.watchedAt)
    );

    const inWatchlist = useInList("watchlist", type, titleIdStr);
    const isFav = useInList("favourites", type, titleIdStr);

    const rating = tmdbData.vote_average ? tmdbData.vote_average.toFixed(1) : null;
    const year = (tmdbData.release_date || tmdbData.first_air_date)?.split("-")[0];
    const runTime = tmdbData.runtime
        ? formatRuntime(tmdbData.runtime)
        : type === "tv" && tmdbData.number_of_seasons
            ? `${tmdbData.number_of_seasons} ${tmdbData.number_of_seasons === 1 ? "season" : "seasons"}`
            : null;
    const genres: string[] = (tmdbData.genres || []).slice(0, 3).map((g: { name: string }) => g.name);
    const logo = tmdbData.images?.logos?.find((l: LogoImage) => l.iso_639_1 === "en") || tmdbData.images?.logos?.[0];

    const getRating = () => {
        if (type === 'movie') {
            const releaseDates = tmdbData.release_dates?.results?.find((r: ReleaseDateResult) => r.iso_3166_1 === 'US');
            return releaseDates?.release_dates?.[0]?.certification || "NR";
        } else {
            const contentRatings = tmdbData.content_ratings?.results?.find((r: ContentRatingResult) => r.iso_3166_1 === 'US');
            return contentRatings?.rating || "NR";
        }
    };
    const certification = getRating();

    const { isReleased, isRecentRelease } = useReleaseStatus(tmdbData.release_date || tmdbData.first_air_date, renderedAt);

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleWatchlistToggle = () => {
        // Details objects have no media_type, so pass the route's type
        const titleRef = toTitleRef(tmdbData, type);
        if (titleRef) setInMyList(titleRef, !inWatchlist);
    };

    const handleFavouriteToggle = () => {
        const titleRef = toTitleRef(tmdbData, type);
        if (titleRef) lib.toggle("favourites", titleRef);
    };

    const handleTogetherToggle = () => {
        const titleRef = toTitleRef(tmdbData, type);
        if (titleRef) {
            if (!lib.inTogether(type, titleIdStr)) {
                lib.toggleTogether(titleRef);
            }
            lib.setWatchedTogether(type, titleIdStr, !isWatchedTogether);
        }
    };

    const externalLinks = [
        tmdbData.homepage && { href: tmdbData.homepage, label: "Official website", icon: <Globe className="h-4 w-4" /> },
        (tmdbData.imdb_id || tmdbData.external_ids?.imdb_id) && {
            href: `https://www.imdb.com/title/${tmdbData.imdb_id || tmdbData.external_ids.imdb_id}`,
            label: "IMDb",
            icon: <span className="text-[10px] font-black tracking-tight">IMDb</span>,
        },
        tmdbData.external_ids?.instagram_id && { href: `https://instagram.com/${tmdbData.external_ids.instagram_id}`, label: "Instagram", icon: <Instagram className="h-4 w-4" /> },
        tmdbData.external_ids?.twitter_id && { href: `https://twitter.com/${tmdbData.external_ids.twitter_id}`, label: "Twitter / X", icon: <Twitter className="h-4 w-4" /> },
        (tmdbData.facebook_id || tmdbData.external_ids?.facebook_id) && {
            href: `https://facebook.com/${tmdbData.facebook_id || tmdbData.external_ids.facebook_id}`,
            label: "Facebook",
            icon: <Facebook className="h-4 w-4" />,
        },
        tmdbData.external_ids?.youtube_id && { href: `https://youtube.com/${tmdbData.external_ids.youtube_id}`, label: "YouTube", icon: <Youtube className="h-4 w-4" /> },
        tmdbData.external_ids?.tiktok_id && { href: `https://tiktok.com/@${tmdbData.external_ids.tiktok_id}`, label: "TikTok", icon: <Tiktok className="h-4 w-4" /> },
    ].filter(Boolean) as { href: string; label: string; icon: React.ReactNode }[];

    return (
        <section className="relative w-full bg-ink">
            {/* Backdrop with gradient protection */}
            <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
                {tmdbData.backdrop_path ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={tmdbImage("w1280", tmdbData.backdrop_path)}
                        srcSet={heroSrcSet(tmdbData.backdrop_path)}
                        sizes="100vw"
                        fetchPriority="high"
                        decoding="async"
                        alt=""
                        className="h-full w-full object-cover object-[center_20%]"
                    />
                ) : tmdbData.poster_path ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={tmdbImage("w342", tmdbData.poster_path)} alt="" className="h-full w-full object-cover opacity-40 blur-3xl scale-110" />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/85 to-ink/30" />
                <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/60 to-transparent" />
            </div>

            <div className="relative page-gutter pt-24 pb-12 md:pt-32 md:pb-16 lg:min-h-[78vh] lg:flex lg:items-end">
                <div className="grid w-full grid-cols-1 items-end gap-10 lg:grid-cols-[minmax(0,1fr)_auto]">
                    {/* Info */}
                    <div className="max-w-2xl">
                        {logo ? (
                            <div className="mb-5 md:mb-6 h-20 sm:h-24 md:h-32 lg:h-36 max-w-[26rem] flex items-end">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={`${TMDB_CONFIG.imageBase}/w500${logo.file_path}`}
                                    srcSet={`${TMDB_CONFIG.imageBase}/w300${logo.file_path} 300w, ${TMDB_CONFIG.imageBase}/w500${logo.file_path} 500w`}
                                    sizes="(min-width: 640px) 416px, 300px"
                                    decoding="async"
                                    alt={title}
                                    className="max-h-full max-w-full object-contain object-left-bottom drop-shadow-[0_4px_24px_rgba(0,0,0,0.6)]"
                                />
                            </div>
                        ) : null}

                        <h1 className={cn(
                            "font-display font-extrabold tracking-[-0.035em] text-white text-balance text-shadow-lg",
                            logo ? "sr-only" : "mb-4 text-3xl sm:text-5xl md:text-6xl leading-[1.02]"
                        )}>
                            {title}
                        </h1>

                        {tmdbData.tagline && (
                            <p className="mb-4 text-base md:text-lg italic text-pink/90">{tmdbData.tagline}</p>
                        )}

                        <div className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm font-medium text-gray-200">
                            {rating && (
                                <span className="inline-flex items-center gap-1">
                                    <Star className="h-4 w-4 fill-gold text-gold" aria-hidden="true" />
                                    <span className="font-semibold text-white">{rating}</span>
                                    <span className="text-muted">TMDB</span>
                                </span>
                            )}
                            {year && <span>{year}</span>}
                            {runTime && <span>{runTime}</span>}
                            {certification && certification !== "NR" && <span className="badge">{certification}</span>}
                            {genres.length > 0 && (
                                <span className="text-muted">{genres.join(", ")}</span>
                            )}
                        </div>

                        {tmdbData.overview && (
                            <p className="mb-7 text-[15px] md:text-base leading-relaxed text-gray-300 line-clamp-4 md:line-clamp-5 text-pretty">
                                {tmdbData.overview}
                            </p>
                        )}

                        {/* Primary actions */}
                        <div className="flex flex-wrap items-center gap-3">
                            {isReleased ? (
                                <button onClick={onPlay} className="btn btn-lg btn-primary pl-5 md:pl-6">
                                    <Play className="h-5 w-5 fill-current" aria-hidden="true" />
                                    <span className="flex flex-col items-start leading-none text-left">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-white/70">
                                            {type === 'tv' ? `S${currentSeason} · Episode ${currentEpisode}` : "Movie"}
                                        </span>
                                        <span className="mt-0.5">{type === 'tv' ? "Start Watching" : "Watch Now"}</span>
                                    </span>
                                </button>
                            ) : (
                                <button disabled className="btn btn-lg btn-primary">
                                    Coming soon
                                </button>
                            )}

                            {trailer && (
                                <button onClick={() => setShowTrailer(true)} className="btn btn-lg btn-ghost">
                                    <Clapperboard className="h-5 w-5" aria-hidden="true" />
                                    Trailer
                                </button>
                            )}

                            {/* Favourites Heart Button */}
                            <button
                                onClick={handleFavouriteToggle}
                                aria-pressed={isFav}
                                className={cn(
                                    "btn-icon h-12 w-12 md:h-[52px] md:w-[52px]",
                                    isFav && "bg-love border-love text-white shadow-[0_0_16px_rgba(244,63,94,0.5)]"
                                )}
                                title={isFav ? "Remove from favourites" : "Add to our favourites"}
                                aria-label="Toggle favourite"
                            >
                                <Heart className={cn("h-5 w-5", isFav && "fill-white")} />
                            </button>

                            {/* Watchlist Plus Button */}
                            <button
                                onClick={handleWatchlistToggle}
                                aria-pressed={inWatchlist}
                                className={cn(
                                    "btn-icon h-12 w-12 md:h-[52px] md:w-[52px]",
                                    inWatchlist && "bg-accent border-accent text-on-accent shadow-[0_0_16px_rgba(255,141,179,0.5)]"
                                )}
                                title={inWatchlist ? "Remove from Watchlist" : "Add to Watchlist"}
                                aria-label={inWatchlist ? "Remove from My List" : "Add to My List"}
                            >
                                {inWatchlist ? <Check className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                            </button>

                            {/* Watched Together Toggle Button */}
                            <button
                                onClick={handleTogetherToggle}
                                className={cn(
                                    "btn btn-lg border",
                                    isWatchedTogether
                                        ? "bg-love/20 border-love text-love shadow-[0_0_14px_rgba(244,63,94,0.3)]"
                                        : "btn-ghost text-muted hover:text-white"
                                )}
                                title="Mark as watched together"
                            >
                                <Heart className={cn("h-4 w-4", isWatchedTogether && "fill-love")} />
                                <span className="text-xs sm:text-sm font-semibold">
                                    {isWatchedTogether ? "Watched Together 💕" : "Watched Together?"}
                                </span>
                            </button>

                            {/* Share Button */}
                            <button
                                onClick={handleShare}
                                className={cn(
                                    "btn-icon h-12 w-12 md:h-[52px] md:w-[52px]",
                                    copied && "bg-emerald-500/20 border-emerald-400/40 text-emerald-300"
                                )}
                                title="Share"
                                aria-label={copied ? "Link copied" : "Copy link"}
                            >
                                {copied ? <Check className="h-5 w-5" /> : <Share2 className="h-5 w-5" />}
                            </button>
                        </div>

                        {isRecentRelease && (
                            <p className="mt-3 text-xs text-muted">
                                Released recently — if it isn&apos;t available yet, check back a little later.
                            </p>
                        )}

                        {/* Season picker + external links */}
                        {(type === "tv" || externalLinks.length > 0) && (
                            <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-4">
                                {type === 'tv' && (
                                    <Dropdown
                                        value={currentSeason}
                                        onChange={(val) => onSeasonChange(Number(val))}
                                        options={tmdbData.seasons
                                            ?.filter((s: SeasonData) => s.season_number > 0)
                                            .map((s: SeasonData) => ({
                                                value: s.season_number,
                                                label: s.name || `Season ${s.season_number}`
                                            })) || []
                                        }
                                        menuClassName="min-w-[200px]"
                                    />
                                )}
                                {externalLinks.length > 0 && (
                                    <ul className="flex flex-wrap items-center gap-2" aria-label="External links">
                                        {externalLinks.map((link) => (
                                            <li key={link.label}>
                                                <a
                                                    href={link.href}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    title={link.label}
                                                    aria-label={link.label}
                                                    className="grid h-9 min-w-9 place-items-center rounded-full border border-line bg-surface-2/60 px-2 text-gray-300 hover:border-line-strong hover:text-white"
                                                >
                                                    {link.icon}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Poster Card */}
                    {tmdbData.poster_path && (
                        <div className="hidden lg:block">
                            <div className="relative w-64 xl:w-72 aspect-[2/3] overflow-hidden rounded-2xl ring-1 ring-white/15 shadow-[0_30px_70px_-20px_rgba(0,0,0,0.9)]">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={`${TMDB_CONFIG.posterSizes.large}${tmdbData.poster_path}`}
                                    srcSet={`${TMDB_CONFIG.imageBase}/w342${tmdbData.poster_path} 342w, ${TMDB_CONFIG.imageBase}/w500${tmdbData.poster_path} 500w, ${TMDB_CONFIG.posterSizes.large}${tmdbData.poster_path} 780w`}
                                    sizes="(min-width: 1280px) 288px, 256px"
                                    decoding="async"
                                    alt={`${title} poster`}
                                    className="h-full w-full object-cover"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {trailer && (
                <TrailerModal
                    isOpen={showTrailer}
                    onClose={() => setShowTrailer(false)}
                    trailerUrl={`https://www.youtube.com/embed/${trailer.key}?autoplay=1`}
                    title={title}
                />
            )}
        </section>
    );
};

export default DetailsHero;
