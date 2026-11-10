"use client";

import React, { useState, useEffect, useLayoutEffect } from "react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import { TMDB_CONFIG } from "@/lib/tmdbConfig";
import EpisodeList from "@/components/EpisodeList";
import MovieRow from "@/components/MovieRow";
import DetailsHero from "@/components/DetailsHero";
import { ArrowLeft, User, Play, X, Download, ChevronLeft, ChevronRight, Loader2, CheckCircle2 } from "lucide-react";
import { getJSON } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { goBackOrHome } from "@/lib/navHistory";
import TrailerModal from "@/components/TrailerModal";

// The player (and its source list) and the reviews tab are only needed once
// someone presses Play or opens Reviews, so they're split out of the title
// page's first download. The player's code is fetched in the background as
// soon as the page is idle, so Play still starts without waiting for it.
const loadVideoPlayer = () => import("@/components/VideoPlayer");
const VideoPlayer = dynamic(loadVideoPlayer, {
    loading: () => (
        <div className="relative grid w-full aspect-[14/10] sm:aspect-video md:aspect-auto md:h-[82vh] place-items-center bg-black" role="status" aria-label="Loading player">
            <Loader2 className="h-8 w-8 animate-spin text-white/70" aria-hidden="true" />
        </div>
    ),
});
const MoctaleReviews = dynamic(() => import("@/components/MoctaleReviews"), {
    loading: () => (
        <div className="grid place-items-center py-24" role="status" aria-label="Loading reviews">
            <Loader2 className="h-6 w-6 animate-spin text-muted" aria-hidden="true" />
        </div>
    ),
});

interface TabButtonProps {
    name: "episodes" | "related" | "details" | "clips" | "photos" | "reviews";
    label: string;
    activeTab: "episodes" | "related" | "details" | "clips" | "photos" | "reviews";
    setActiveTab: (name: "episodes" | "related" | "details" | "clips" | "photos" | "reviews") => void;
}

const TabButton = ({ name, label, activeTab, setActiveTab }: TabButtonProps) => (
    <button
        role="tab"
        aria-selected={activeTab === name}
        onClick={() => setActiveTab(name)}
        className={`relative h-14 px-3 sm:px-4 text-sm md:text-[15px] font-semibold whitespace-nowrap flex-shrink-0 ${activeTab === name ? "text-white" : "text-muted hover:text-white"
            }`}
    >
        {label}
        {activeTab === name && (
            <span
                className="absolute bottom-0 left-3 right-3 sm:left-4 sm:right-4 h-[2px] rounded-full bg-accent"
            />
        )}
    </button>
);

interface WatchContainerProps {
    type: "movie" | "tv";
    id: string;
    tmdbData: any;
    // When the server rendered the page (Date.now()), for hydration-safe release labels
    renderedAt?: number;
}

// Season details already fetched this session, keyed by "tvId:season"
const seasonCache = new Map<string, any>();

const positiveInt = (value: string | null, fallback: number) => {
    const n = value ? parseInt(value, 10) : NaN;
    return Number.isFinite(n) && n > 0 ? n : fallback;
};

export default function WatchContainer({ type, id, tmdbData, renderedAt }: WatchContainerProps) {
    const router = useRouter();
    const [season, setSeason] = useState(1);
    const [episode, setEpisode] = useState(1);
    const [isPlaying, setIsPlaying] = useState(false);
    const [initialServer, setInitialServer] = useState(0);
    const [activeTab, setActiveTab] = useState<"episodes" | "related" | "details" | "clips" | "photos" | "reviews">(type === "movie" ? "details" : "episodes");
    const [showAllCast, setShowAllCast] = useState(false);
    const [activeVideo, setActiveVideo] = useState<any | null>(null);
    const [activePhoto, setActivePhoto] = useState<{ type: 'backdrop' | 'poster'; index: number; file_path: string } | null>(null);
    const [downloadStatus, setDownloadStatus] = useState<'idle' | 'downloading' | 'success' | 'fallback'>('idle');

    useEffect(() => {
        if (downloadStatus !== 'idle') {
            const delay = downloadStatus === 'fallback' ? 8000 : 4000;
            const timer = setTimeout(() => setDownloadStatus('idle'), delay);
            return () => clearTimeout(timer);
        }
    }, [downloadStatus]);

    // Photos Gallery Handlers & Navigation
    const photoList = React.useMemo(() => {
        if (!activePhoto) return [];
        if (activePhoto.type === 'backdrop') {
            return tmdbData.images?.backdrops || [];
        } else {
            return tmdbData.images?.posters?.slice(0, 18) || [];
        }
    }, [activePhoto, tmdbData.images?.backdrops, tmdbData.images?.posters]);

    const hasPrev = React.useMemo(() => activePhoto !== null && activePhoto.index > 0, [activePhoto]);
    const hasNext = React.useMemo(() => activePhoto !== null && activePhoto.index < photoList.length - 1, [activePhoto, photoList.length]);

    const handlePrev = () => {
        if (!activePhoto || !hasPrev) return;
        const prevIdx = activePhoto.index - 1;
        setActivePhoto({
            type: activePhoto.type,
            index: prevIdx,
            file_path: photoList[prevIdx].file_path
        });
    };

    const handleNext = () => {
        if (!activePhoto || !hasNext) return;
        const nextIdx = activePhoto.index + 1;
        setActivePhoto({
            type: activePhoto.type,
            index: nextIdx,
            file_path: photoList[nextIdx].file_path
        });
    };

    // Keyboard navigation for photo modal
    useEffect(() => {
        if (!activePhoto) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setActivePhoto(null);
            } else if (e.key === "ArrowLeft") {
                if (hasPrev) {
                    const prevIdx = activePhoto.index - 1;
                    setActivePhoto({
                        type: activePhoto.type,
                        index: prevIdx,
                        file_path: photoList[prevIdx].file_path
                    });
                }
            } else if (e.key === "ArrowRight") {
                if (hasNext) {
                    const nextIdx = activePhoto.index + 1;
                    setActivePhoto({
                        type: activePhoto.type,
                        index: nextIdx,
                        file_path: photoList[nextIdx].file_path
                    });
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [activePhoto, photoList, hasPrev, hasNext]);

    const handleDownload = async (filePath: string) => {
        setDownloadStatus('downloading');
        try {
            const originalUrl = `${TMDB_CONFIG.imageBase}/original${filePath}`;
            const proxyUrl = `https://meoserve.utkarshg.workers.dev/api/proxy?url=${encodeURIComponent(originalUrl)}`;
            
            const response = await fetch(proxyUrl);
            if (!response.ok) throw new Error('Proxy download failed');
            
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            
            // Extract a clean filename from filePath
            const filename = filePath.split('/').pop() || 'photo.jpg';
            
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Revoke after a short delay to ensure browser processed click
            setTimeout(() => {
                window.URL.revokeObjectURL(blobUrl);
            }, 100);
            
            setDownloadStatus('success');
        } catch (error) {
            console.error('Failed to download via proxy, falling back:', error);
            // Fallback: open in new tab
            const imageUrl = `${TMDB_CONFIG.imageBase}/original${filePath}`;
            window.open(imageUrl, '_blank');
            setDownloadStatus('fallback');
        }
    };


    // Determine current season data
    const [seasonData, setSeasonData] = useState<any>(null);

    React.useEffect(() => {
        if (type !== 'tv') return;
        const key = `${id}:${season}`;
        const cached = seasonCache.get(key);
        // Show the cached season instantly, or placeholders instead of the
        // previous season's episodes while the new one loads
        setSeasonData(cached ?? null);
        if (cached) return;

        let active = true;
        getJSON<any>(`/api/season?id=${id}&s=${season}`)
            .catch(() => null)
            .then((data) => {
                if (data?.episodes) seasonCache.set(key, data);
                if (active) setSeasonData(data);
            });
        return () => {
            active = false;
        };
    }, [id, season, type]);

    // The page HTML is cached and shared, so ?s=&e=&server=&resume= are read
    // in the browser. useLayoutEffect applies them before the first paint on
    // client-side navigations.
    useLayoutEffect(() => {
        const params = new URLSearchParams(window.location.search);
        setSeason(positiveInt(params.get("s"), 1));
        setEpisode(positiveInt(params.get("e"), 1));
        setInitialServer(Math.max(0, positiveInt(params.get("server"), 0)));
        setIsPlaying(params.get("resume") === "true");
    }, [id, type]);

    // Warm up the player's code once the page has settled, so pressing Play
    // doesn't wait for a download
    useEffect(() => {
        const warm = () => void loadVideoPlayer();
        if ("requestIdleCallback" in window) {
            const handle = window.requestIdleCallback(warm, { timeout: 3000 });
            return () => window.cancelIdleCallback(handle);
        }
        const timer = setTimeout(warm, 1500);
        return () => clearTimeout(timer);
    }, []);

    // Handle Navbar visibility via body class
    React.useEffect(() => {
        if (isPlaying) {
            document.body.classList.add("player-active");
        } else {
            document.body.classList.remove("player-active");
        }
        return () => {
            document.body.classList.remove("player-active");
        };
    }, [isPlaying]);

    // Use fetched season data or fallback to basic placeholders if loading/failed
    const episodesList = seasonData?.episodes || (tmdbData.seasons?.find((s: any) => s.season_number === season)
        ? Array.from({ length: tmdbData.seasons.find((s: any) => s.season_number === season).episode_count || 10 }, (_, i) => ({
            id: i,
            episode_number: i + 1,
            season_number: season,
            name: `Episode ${i + 1}`,
            overview: "",
            still_path: null,
            runtime: 0,
            air_date: ""
        }))
        : []);

    // Playback state
    const cast: any[] = tmdbData.credits?.cast || [];
    const directors = tmdbData.credits?.crew?.filter((c: any) => c.job === "Director").slice(0, 2) || [];
    const writers = tmdbData.credits?.crew?.filter((c: any) => ["Writer", "Screenplay", "Author", "Teleplay"].includes(c.job)).slice(0, 3) || [];
    const keywords = (type === 'movie' ? tmdbData.keywords?.keywords : tmdbData.keywords?.results) || [];
    const studios = [
        ...(type === 'tv' ? (tmdbData.networks || []).map((n: any) => ({ ...n, kind: "Network", href: `/network/${n.id}` })) : []),
        ...(tmdbData.production_companies || []).filter((c: any) => c.logo_path).slice(0, 4).map((c: any) => ({ ...c, kind: "Studio", href: `/company/${c.id}` })),
    ];
    const facts = [
        { label: "Status", value: tmdbData.status },
        { label: type === "tv" ? "First aired" : "Release date", value: (tmdbData.release_date || tmdbData.first_air_date) ? new Date(tmdbData.release_date || tmdbData.first_air_date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" }) : null },
        { label: "Runtime", value: tmdbData.runtime > 0 ? `${Math.floor(tmdbData.runtime / 60)}h ${tmdbData.runtime % 60}m` : null },
        { label: "Seasons", value: type === 'tv' ? tmdbData.number_of_seasons : null },
        { label: "Episodes", value: type === 'tv' ? tmdbData.number_of_episodes : null },
        { label: "Original language", value: tmdbData.original_language ? (() => { try { return new Intl.DisplayNames(["en"], { type: "language" }).of(tmdbData.original_language); } catch { return tmdbData.original_language.toUpperCase(); } })() : null },
        { label: "TMDB rating", value: tmdbData.vote_average > 0 ? `${tmdbData.vote_average.toFixed(1)} / 10` : null },
        { label: "Genres", value: tmdbData.genres?.map((g: any) => g.name).join(", ") },
    ].filter((f) => f.value);


    return (
        <div className="flex flex-col">
            {/* Go Back Button — always visible top-left */}
            <button
                onClick={() => goBackOrHome(router)}
                className="fixed top-4 left-4 md:top-6 md:left-8 z-[60] btn-icon bg-black/45 hover:bg-black/70 group"
                title="Go Back"
                aria-label="Go back"
            >
                <ArrowLeft className="w-5 h-5" />
            </button>

            {/* Hero / Player Section */}
            <div className={`relative w-full z-40 ${isPlaying ? "bg-black" : ""}`}>

                {!isPlaying ? (
                    <DetailsHero
                        tmdbData={tmdbData}
                        type={type}
                        onPlay={() => setIsPlaying(true)}
                        currentSeason={season}
                        onSeasonChange={(s) => {
                            setSeason(s);
                            setEpisode(1);
                        }}
                        currentEpisode={episode}
                        renderedAt={renderedAt}
                    />
                ) : (
                    <VideoPlayer
                        type={type}
                        id={id}
                        tmdbData={tmdbData}
                        season={season}
                        episode={episode}
                        initialServer={initialServer}
                        onSeasonChange={(s) => {
                            setSeason(s);
                            setEpisode(1); // Reset episode on season change
                        }}
                        onEpisodeChange={setEpisode}
                    />
                )}
            </div>

            {/* Tabs Navigation */}
            <div className="sticky top-0 z-30 bg-ink/90 shadow-[inset_0_-1px_0_rgba(255,255,255,0.08)]">
                <div role="tablist" aria-label="Title sections" className="page-gutter flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-none [&>:first-child]:-ml-3 sm:[&>:first-child]:-ml-4">
                    {type === 'tv' && <TabButton name="episodes" label="Episodes" activeTab={activeTab} setActiveTab={setActiveTab} />}
                    <TabButton name="details" label="Details" activeTab={activeTab} setActiveTab={setActiveTab} />
                    <TabButton name="related" label="More like this" activeTab={activeTab} setActiveTab={setActiveTab} />
                    {tmdbData.videos?.results?.length > 0 && <TabButton name="clips" label="Trailers & clips" activeTab={activeTab} setActiveTab={setActiveTab} />}
                    {(tmdbData.images?.backdrops?.length > 0 || tmdbData.images?.posters?.length > 0) && <TabButton name="photos" label="Photos" activeTab={activeTab} setActiveTab={setActiveTab} />}
                    <TabButton name="reviews" label="Reviews" activeTab={activeTab} setActiveTab={setActiveTab} />
                </div>
            </div>

            {/* Tab Content */}
            <div className="py-8 md:py-12 min-h-[480px]">
                <>
                    {activeTab === "episodes" && type === "tv" && (
                        <div key="episodes" className="page-gutter" role="tabpanel">
                            <EpisodeList
                                episodes={episodesList as any[]}
                                currentSeason={season}
                                currentEpisode={episode}
                                isPlaying={isPlaying}
                                seasons={tmdbData.seasons?.filter((s: any) => s.season_number > 0)}
                                onSeasonChange={(s) => {
                                    setSeason(s);
                                    setEpisode(1);
                                }}
                                onEpisodeSelect={(ep) => {
                                    setEpisode(ep);
                                    setIsPlaying(true);
                                    window.scrollTo({ top: 0, behavior: "instant" });
                                }}
                            />
                        </div>
                    )}

                    {activeTab === "related" && (
                        <div key="related" className="space-y-12" role="tabpanel">
                            <MovieRow
                                title="Recommended"
                                movies={tmdbData.recommendations?.results?.slice(0, 10).map((r: any) => ({ ...r, media_type: type })) || []}
                            />
                            <MovieRow
                                title="Similar titles"
                                movies={tmdbData.similar?.results?.slice(0, 10).map((r: any) => ({ ...r, media_type: type })) || []}
                            />
                            {!tmdbData.recommendations?.results?.length && !tmdbData.similar?.results?.length && (
                                <EmptyPanel title="Nothing related yet" text="TMDB doesn't list any recommendations for this title." />
                            )}
                        </div>
                    )}

                    {activeTab === "clips" && (
                        <div key="clips" className="page-gutter" role="tabpanel">
                            <SectionHeading title="Trailers & clips" count={tmdbData.videos?.results?.length} />
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
                                {tmdbData.videos?.results?.map((video: any) => (
                                    <button
                                        type="button"
                                        key={video.id}
                                        className="group text-left"
                                        onClick={() => setActiveVideo(video)}
                                    >
                                        <div className="relative aspect-video overflow-hidden rounded-xl bg-surface-2 ring-1 ring-white/[0.06] group-hover:ring-white/25">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={`https://img.youtube.com/vi/${video.key}/mqdefault.jpg`}
                                                srcSet={`https://img.youtube.com/vi/${video.key}/mqdefault.jpg 320w, https://img.youtube.com/vi/${video.key}/hqdefault.jpg 480w`}
                                                sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                                                loading="lazy"
                                                decoding="async"
                                                className="h-full w-full object-cover"
                                                alt=""
                                            />
                                            <div className="absolute inset-0 grid place-items-center bg-black/30 group-hover:bg-black/10">
                                                <span className="grid h-12 w-12 place-items-center rounded-full bg-white/95 text-ink shadow-xl">
                                                    <Play className="h-5 w-5 fill-current translate-x-px" />
                                                </span>
                                            </div>
                                            <span className="absolute top-2.5 left-2.5 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                                                {video.type}
                                            </span>
                                        </div>
                                        <h4 className="mt-2.5 text-sm font-semibold text-white line-clamp-1 group-hover:text-white">{video.name}</h4>
                                        <p className="text-xs text-muted">{video.site}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === "photos" && (
                        <div key="photos" className="page-gutter space-y-12" role="tabpanel">
                            {/* Backdrops Gallery */}
                            {tmdbData.images?.backdrops?.length > 0 && (
                                <div>
                                    <SectionHeading title="Backdrops" count={tmdbData.images.backdrops.length} />
                                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                                        {tmdbData.images.backdrops.map((image: any, idx: number) => (
                                            <button
                                                type="button"
                                                key={idx}
                                                aria-label={`Open backdrop ${idx + 1}`}
                                                className="group relative aspect-video overflow-hidden rounded-xl bg-surface-2 ring-1 ring-white/[0.06] hover:ring-white/25 cursor-zoom-in"
                                                onClick={() => setActivePhoto({ type: 'backdrop', index: idx, file_path: image.file_path })}
                                            >
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={`${TMDB_CONFIG.imageBase}/w780${image.file_path}`}
                                                    srcSet={`${TMDB_CONFIG.imageBase}/w300${image.file_path} 300w, ${TMDB_CONFIG.imageBase}/w780${image.file_path} 780w`}
                                                    sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, 50vw"
                                                    loading="lazy"
                                                    decoding="async"
                                                    className="h-full w-full object-cover"
                                                    alt=""
                                                />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Posters Gallery */}
                            {tmdbData.images?.posters?.length > 0 && (
                                <div>
                                    <SectionHeading title="Posters" count={tmdbData.images.posters.length} />
                                    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
                                        {tmdbData.images.posters.slice(0, 18).map((image: any, idx: number) => (
                                            <button
                                                type="button"
                                                key={idx}
                                                aria-label={`Open poster ${idx + 1}`}
                                                className="group relative aspect-[2/3] overflow-hidden rounded-xl bg-surface-2 ring-1 ring-white/[0.06] hover:ring-white/25 cursor-zoom-in"
                                                onClick={() => setActivePhoto({ type: 'poster', index: idx, file_path: image.file_path })}
                                            >
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={`${TMDB_CONFIG.imageBase}/w342${image.file_path}`}
                                                    srcSet={`${TMDB_CONFIG.imageBase}/w185${image.file_path} 185w, ${TMDB_CONFIG.imageBase}/w342${image.file_path} 342w, ${TMDB_CONFIG.imageBase}/w500${image.file_path} 500w`}
                                                    sizes="(min-width: 1024px) 16vw, (min-width: 640px) 25vw, 33vw"
                                                    loading="lazy"
                                                    decoding="async"
                                                    className="h-full w-full object-cover"
                                                    alt=""
                                                />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "details" && (
                        <div key="details" className="page-gutter space-y-14" role="tabpanel">
                            <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px]">
                                {/* Main column */}
                                <div className="min-w-0 space-y-12">
                                    {tmdbData.overview && (
                                        <section>
                                            <h2 className="mb-3 font-display text-xl md:text-2xl font-bold text-white">Storyline</h2>
                                            <p className="max-w-3xl text-[15px] md:text-base leading-relaxed text-gray-300 text-pretty">{tmdbData.overview}</p>
                                        </section>
                                    )}

                                    {/* Cast */}
                                    {cast.length > 0 && (
                                        <section>
                                            <SectionHeading title="Cast" count={cast.length} />
                                            <ul className={cn(
                                                "gap-3 md:gap-4",
                                                showAllCast
                                                    ? "grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6"
                                                    : "flex overflow-x-auto scrollbar-none snap-x pb-2 -mx-4 px-4 sm:mx-0 sm:px-0"
                                            )}>
                                                {cast.slice(0, showAllCast ? 100 : 12).map((person: any) => (
                                                    <li key={person.id} className={cn(!showAllCast && "w-[112px] sm:w-[128px] flex-none snap-start")}>
                                                        <Link href={`/person/${person.id}`} className="group block">
                                                            <div className="aspect-[2/3] overflow-hidden rounded-xl bg-surface-2 ring-1 ring-white/[0.06] group-hover:ring-white/25">
                                                                {person.profile_path ? (
                                                                    // eslint-disable-next-line @next/next/no-img-element
                                                                    <img
                                                                        src={`https://image.tmdb.org/t/p/w185${person.profile_path}`}
                                                                        alt=""
                                                                        loading="lazy"
                                                                        decoding="async"
                                                                        className="h-full w-full object-cover"
                                                                    />
                                                                ) : (
                                                                    <div className="grid h-full w-full place-items-center text-subtle"><User className="h-8 w-8" /></div>
                                                                )}
                                                            </div>
                                                            <p className="mt-2 text-[13px] font-semibold leading-tight text-white line-clamp-2">{person.name}</p>
                                                            {person.character && <p className="mt-0.5 text-xs text-muted line-clamp-1">{person.character}</p>}
                                                        </Link>
                                                    </li>
                                                ))}
                                            </ul>

                                            {cast.length > 12 && (
                                                <button
                                                    onClick={() => setShowAllCast(!showAllCast)}
                                                    className="btn btn-sm btn-ghost mt-5"
                                                >
                                                    {showAllCast ? "Show less" : `View all ${cast.length} cast members`}
                                                </button>
                                            )}
                                        </section>
                                    )}
                                </div>

                                {/* Sidebar facts */}
                                <aside className="space-y-8">
                                    {facts.length > 0 && (
                                        <div className="surface p-6">
                                            <h3 className="eyebrow mb-4 font-sans">About this {type === "tv" ? "series" : "film"}</h3>
                                            <dl className="divide-y divide-line">
                                                {facts.map((f) => (
                                                    <div key={f.label} className="flex items-baseline justify-between gap-6 py-2.5 first:pt-0 last:pb-0">
                                                        <dt className="text-sm text-muted shrink-0">{f.label}</dt>
                                                        <dd className="text-sm font-medium text-white text-right">{f.value}</dd>
                                                    </div>
                                                ))}
                                            </dl>
                                        </div>
                                    )}

                                    {(directors.length > 0 || writers.length > 0) && (
                                        <div className="surface p-6">
                                            <h3 className="eyebrow mb-4 font-sans">Key crew</h3>
                                            <ul className="space-y-3">
                                                {[...directors, ...writers].map((person: any, i: number) => (
                                                    <li key={`${person.id}-${person.job}-${i}`}>
                                                        <Link href={`/person/${person.id}`} className="group flex items-center gap-3">
                                                            <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-surface-3 ring-1 ring-white/10">
                                                                {person.profile_path ? (
                                                                    // eslint-disable-next-line @next/next/no-img-element
                                                                    <img src={`https://image.tmdb.org/t/p/w185${person.profile_path}`} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                                                                ) : (
                                                                    <div className="grid h-full w-full place-items-center text-subtle"><User className="h-4 w-4" /></div>
                                                                )}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="truncate text-sm font-semibold text-white group-hover:underline underline-offset-4 decoration-white/30">{person.name}</p>
                                                                <p className="text-xs text-muted">{person.job}</p>
                                                            </div>
                                                        </Link>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {studios.length > 0 && (
                                        <div className="surface p-6">
                                            <h3 className="eyebrow mb-4 font-sans">{type === 'tv' ? 'Networks & studios' : 'Production'}</h3>
                                            <ul className="space-y-2">
                                                {studios.map((studio: any) => (
                                                    <li key={`${studio.kind}-${studio.id}`}>
                                                        <Link href={studio.href} className="group flex items-center gap-3 rounded-xl p-1.5 -m-1.5 hover:bg-white/[0.04]">
                                                            <span className="grid h-10 w-16 shrink-0 place-items-center rounded-lg bg-white/95 p-1.5">
                                                                {studio.logo_path ? (
                                                                    // eslint-disable-next-line @next/next/no-img-element
                                                                    <img src={`${TMDB_CONFIG.imageBase}/w200${studio.logo_path}`} alt="" loading="lazy" className="max-h-full max-w-full object-contain" />
                                                                ) : null}
                                                            </span>
                                                            <span className="min-w-0">
                                                                <span className="block truncate text-sm font-semibold text-white">{studio.name}</span>
                                                                <span className="block text-xs text-muted">{studio.kind}</span>
                                                            </span>
                                                        </Link>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {keywords.length > 0 && (
                                        <div>
                                            <h3 className="eyebrow mb-3 font-sans">Keywords</h3>
                                            <ul className="flex flex-wrap gap-2">
                                                {keywords.map((keyword: any) => (
                                                    <li key={keyword.id} className="rounded-full border border-line bg-white/[0.03] px-3 py-1 text-xs text-gray-300">
                                                        {keyword.name}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </aside>
                            </div>

                            {/* Franchise / Collection */}
                            {tmdbData.belongs_to_collection && (
                                <Link
                                    href={`/collection/${tmdbData.belongs_to_collection.id}`}
                                    className="group relative block h-56 md:h-72 w-full overflow-hidden rounded-2xl ring-1 ring-white/10"
                                >
                                    {tmdbData.belongs_to_collection.backdrop_path && (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={`${TMDB_CONFIG.backdropSizes.large}${tmdbData.belongs_to_collection.backdrop_path}`}
                                            loading="lazy"
                                            decoding="async"
                                            className="absolute inset-0 h-full w-full object-cover"
                                            alt=""
                                        />
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/70 to-transparent" />
                                    <div className="relative flex h-full flex-col justify-center gap-3 p-7 md:p-12">
                                        <span className="eyebrow">Part of the franchise</span>
                                        <h3 className="font-display text-2xl md:text-4xl font-extrabold text-white max-w-lg text-balance">{tmdbData.belongs_to_collection.name}</h3>
                                        <span className="btn btn-sm btn-primary w-fit mt-2">View collection</span>
                                    </div>
                                </Link>
                            )}
                        </div>
                    )}

                    {activeTab === "reviews" && (
                        <div key="reviews" className="page-gutter" role="tabpanel">
                            <MoctaleReviews
                                title={tmdbData.title || tmdbData.name}
                                date={tmdbData.release_date || tmdbData.first_air_date}
                                type={type}
                                tmdbRating={tmdbData.vote_average}
                                genres={tmdbData.genres?.map((g: any) => g.name) || []}
                                overview={tmdbData.overview || ""}
                            />
                        </div>
                    )}
                </>
            </div>

            {/* Video Modal Player */}
            <TrailerModal
                isOpen={!!activeVideo}
                onClose={() => setActiveVideo(null)}
                trailerUrl={activeVideo ? `https://www.youtube.com/embed/${activeVideo.key}?autoplay=1` : null}
                title={activeVideo?.name || ""}
            />

            {/* Photo Modal Viewer */}
            <>
                {activePhoto && (
                    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-4 md:p-8" role="dialog" aria-modal="true" aria-label="Photo viewer">
                        <div
                            onClick={() => setActivePhoto(null)}
                            className="absolute inset-0 bg-black/95"
                        />

                        {/* Top controls */}
                        <div className="absolute top-4 right-4 md:top-6 md:right-6 z-[110] flex items-center gap-2">
                            <button
                                onClick={() => handleDownload(activePhoto.file_path)}
                                className="btn btn-sm btn-ghost"
                                title="Download image"
                            >
                                <Download className="w-4 h-4" />
                                <span className="hidden md:inline">Download</span>
                            </button>
                            <button
                                onClick={() => setActivePhoto(null)}
                                className="btn-icon h-10 w-10"
                                title="Close viewer"
                                aria-label="Close viewer"
                                autoFocus
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Image */}
                        <div
                            className="relative max-w-[92vw] max-h-[75vh] md:max-h-[80vh] flex items-center justify-center z-[105]"
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                    key={activePhoto.file_path}
                                    src={`${TMDB_CONFIG.imageBase}/original${activePhoto.file_path}`}
                                    className={cn(
                                        "object-contain w-full h-full max-h-[72vh] md:max-h-[78vh] rounded-xl select-none shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)]",
                                        activePhoto.type === 'backdrop' ? 'aspect-video' : 'aspect-[2/3]'
                                    )}
                                    alt={`${activePhoto.type === 'backdrop' ? 'Backdrop' : 'Poster'} ${activePhoto.index + 1}`}
                                />
                        </div>

                        {/* Bottom navigation */}
                        <div className="relative mt-5 flex items-center gap-4 rounded-full border border-line bg-black/60 px-2 py-1.5 z-[105]">
                            <button
                                onClick={handlePrev}
                                disabled={!hasPrev}
                                className="grid h-9 w-9 place-items-center rounded-full text-white hover:bg-white/10 disabled:opacity-25 disabled:hover:bg-transparent"
                                title="Previous Photo"
                                aria-label="Previous photo"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <span className="min-w-[90px] select-none text-center text-sm font-semibold tabular-nums text-white">
                                {activePhoto.index + 1} <span className="text-subtle">/ {photoList.length}</span>
                            </span>
                            <button
                                onClick={handleNext}
                                disabled={!hasNext}
                                className="grid h-9 w-9 place-items-center rounded-full text-white hover:bg-white/10 disabled:opacity-25 disabled:hover:bg-transparent"
                                title="Next Photo"
                                aria-label="Next photo"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Download status toast */}
                        <>
                            {downloadStatus !== 'idle' && (
                                <div
                                    role="status"
                                    className="fixed bottom-24 left-1/2 -translate-x-1/2 md:left-auto md:right-8 md:translate-x-0 z-[120] max-w-sm w-[calc(100vw-2rem)] surface bg-surface-2/95 p-4 shadow-2xl flex items-start gap-3 text-white"
                                >
                                    {downloadStatus === 'downloading' && (
                                        <>
                                            <Loader2 className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-muted" />
                                            <div className="flex-1 min-w-0 text-left">
                                                <h4 className="text-sm font-semibold text-white">Downloading image</h4>
                                                <p className="mt-0.5 text-xs text-muted leading-relaxed">Fetching the full-resolution photo…</p>
                                            </div>
                                        </>
                                    )}

                                    {downloadStatus === 'success' && (
                                        <>
                                            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                                            <div className="flex-1 min-w-0 text-left">
                                                <h4 className="text-sm font-semibold text-white">Download complete</h4>
                                                <p className="mt-0.5 text-xs text-muted leading-relaxed">The image has been saved to your downloads folder.</p>
                                            </div>
                                        </>
                                    )}

                                    {downloadStatus === 'fallback' && (
                                        <>
                                            <Download className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
                                            <div className="flex-1 min-w-0 text-left">
                                                <h4 className="text-sm font-semibold text-white">Opened in a new tab</h4>
                                                <p className="mt-0.5 text-xs text-muted leading-relaxed">
                                                    Right-click (or long-press on mobile) the image and choose <span className="text-white">&quot;Save image as…&quot;</span>.
                                                </p>
                                            </div>
                                        </>
                                    )}

                                    <button
                                        onClick={() => setDownloadStatus('idle')}
                                        className="p-1 rounded-lg text-muted hover:text-white hover:bg-white/5 shrink-0"
                                        aria-label="Dismiss"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </>
                    </div>
                )}
            </>
        </div>
    );
}

function SectionHeading({ title, count }: { title: string; count?: number }) {
    return (
        <div className="mb-5 flex items-baseline gap-3">
            <h2 className="font-display text-xl md:text-2xl font-bold text-white">{title}</h2>
            {typeof count === "number" && <span className="text-sm font-medium text-subtle tabular-nums">{count}</span>}
        </div>
    );
}

function EmptyPanel({ title, text }: { title: string; text: string }) {
    return (
        <div className="page-gutter">
            <div className="surface flex flex-col items-center justify-center px-6 py-16 text-center">
                <p className="font-display text-lg font-bold text-white">{title}</p>
                <p className="mt-1 text-sm text-muted">{text}</p>
            </div>
        </div>
    );
}
