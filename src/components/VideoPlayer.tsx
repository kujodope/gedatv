"use client";

import React, { useState, useEffect, useRef } from "react";
import {
    Server,
    Maximize2,
    Minimize2,
    RefreshCcw,
    Share2,
    Check,
    ChevronLeft,
    ChevronRight,
    Sparkles,
    AlertCircle,
    Heart
} from "lucide-react";
import { cn } from "@/lib/utils";
import { saveToRecentlyPlayed } from "@/lib/storage";
import { lib, toTitleRef } from "@/lib/library";
import Dropdown from "@/components/ui/Dropdown";
import { SERVERS, getPlayerUrl } from "@/lib/videoSources";

interface VideoPlayerProps {
    type: "movie" | "tv";
    id: string;
    tmdbData: any;
    season?: number;
    episode?: number;
    initialServer?: number;
    onSeasonChange?: (season: number) => void;
    onEpisodeChange?: (episode: number) => void;
}

export default function VideoPlayer({
    type,
    id,
    tmdbData,
    season: controlledSeason,
    episode: controlledEpisode,
    initialServer,
    onSeasonChange,
    onEpisodeChange
}: VideoPlayerProps) {
    const [internalSeason, setInternalSeason] = useState(1);
    const [internalEpisode, setInternalEpisode] = useState(1);
    // Old share links can carry an index from before sources were removed
    const [selectedServer, setSelectedServer] = useState(() =>
        Math.min(Math.max(0, initialServer ?? 0), SERVERS.length - 1)
    );
    // Whether the provider's page has loaded in the iframe. Embeds are
    // cross-origin, so this is all we can know; it doesn't prove the video plays.
    const [frameLoaded, setFrameLoaded] = useState(false);
    const [isSlow, setIsSlow] = useState(false);
    const [isTheaterMode, setIsTheaterMode] = useState(false);
    const [playerKey, setPlayerKey] = useState(0);
    const [copied, setCopied] = useState(false);
    const [showSourceHint, setShowSourceHint] = useState(false);

    const isControlled = controlledSeason !== undefined && controlledEpisode !== undefined;
    const currentSeason = isControlled ? controlledSeason : internalSeason;
    const currentEpisode = isControlled ? controlledEpisode : internalEpisode;

    const seasons = ((tmdbData?.seasons as Array<{ season_number: number; name?: string; episode_count: number }>) || [])
        .filter((s) => s.season_number > 0);
    const currentSeasonData = seasons.find((s) => s.season_number === currentSeason);
    const episodeCount = currentSeasonData?.episode_count || 50;

    const handleSeasonChange = (s: number) => {
        if (isControlled) {
            onSeasonChange?.(s);
        } else {
            setInternalSeason(s);
            setInternalEpisode(1);
        }
    };

    const handleEpisodeChange = (e: number) => {
        if (isControlled) {
            onEpisodeChange?.(e);
        } else {
            setInternalEpisode(e);
        }
    };

    const handlePrevEpisode = () => {
        if (currentEpisode > 1) {
            handleEpisodeChange(currentEpisode - 1);
        } else if (currentSeason > 1) {
            const prevSeason = currentSeason - 1;
            const prevSeasonData = seasons.find((s) => s.season_number === prevSeason);
            handleSeasonChange(prevSeason);
            handleEpisodeChange(prevSeasonData?.episode_count || 1);
        }
    };

    const isLastEpisode = currentEpisode >= episodeCount && !seasons.some((s) => s.season_number === currentSeason + 1);

    const handleNextEpisode = () => {
        if (currentEpisode < episodeCount) {
            handleEpisodeChange(currentEpisode + 1);
        } else {
            const nextSeason = currentSeason + 1;
            const hasNextSeason = seasons.some((s) => s.season_number === nextSeason);
            if (hasNextSeason) {
                handleSeasonChange(nextSeason);
                handleEpisodeChange(1);
            }
        }
    };

    // Save to recently played (both legacy and library)
    useEffect(() => {
        if (tmdbData) {
            const title = tmdbData.title || tmdbData.name || "Untitled";
            const recentPayload = {
                id,
                type,
                title,
                overview: tmdbData.overview,
                poster_path: tmdbData.poster_path,
                backdrop_path: tmdbData.backdrop_path,
                vote_average: tmdbData.vote_average,
                release_date: tmdbData.release_date,
                first_air_date: tmdbData.first_air_date,
                last_played: Date.now(),
                season: type === "tv" ? currentSeason : undefined,
                episode: type === "tv" ? currentEpisode : undefined,
                tagline: tmdbData.tagline,
            };

            saveToRecentlyPlayed(recentPayload);

            // Details objects have no media_type, so pass the route's type
            const titleRef = toTitleRef(tmdbData, type);
            if (titleRef) {
                lib.recordPlay({
                    ...titleRef,
                    id: String(id),
                    type,
                    season: type === "tv" ? currentSeason : undefined,
                    episode: type === "tv" ? currentEpisode : undefined,
                    tagline: tmdbData.tagline,
                });
            }
        }
    }, [id, type, tmdbData, currentSeason, currentEpisode]);

    const iframeRef = useRef<HTMLIFrameElement>(null);
    const sourcesRef = useRef<HTMLDivElement>(null);
    const frameKey = `${selectedServer}-${currentSeason}-${currentEpisode}-${playerKey}`;

    // Every source/episode/reload change mounts a fresh iframe (React removes
    // the old one, which unloads it). Track loading for the new one.
    useEffect(() => {
        setFrameLoaded(false);
        setIsSlow(false);
        const timer = setTimeout(() => setIsSlow(true), 15000);
        return () => clearTimeout(timer);
    }, [frameKey]);

    // On narrow screens the source chips scroll sideways; keep the active one
    // visible (scrolls only the chip row, never the page)
    useEffect(() => {
        const row = sourcesRef.current;
        const chip = row?.querySelector<HTMLElement>('[aria-checked="true"]');
        if (!row || !chip) return;
        const left = chip.getBoundingClientRect().left - row.getBoundingClientRect().left + row.scrollLeft;
        if (left < row.scrollLeft || left + chip.offsetWidth > row.scrollLeft + row.clientWidth) {
            row.scrollLeft = left - (row.clientWidth - chip.offsetWidth) / 2;
        }
    }, [selectedServer]);

    // Keep the address bar in sync so a refresh, the back button or a copied
    // URL return to the same episode and source
    useEffect(() => {
        const url = new URL(window.location.href);
        url.searchParams.set("resume", "true");
        url.searchParams.set("server", String(selectedServer));
        if (type === "tv") {
            url.searchParams.set("s", String(currentSeason));
            url.searchParams.set("e", String(currentEpisode));
        }
        if (url.href !== window.location.href) {
            window.history.replaceState(window.history.state, "", url);
        }
    }, [type, selectedServer, currentSeason, currentEpisode]);

    // Space with nothing focused moves focus into the player instead of
    // scrolling the page. Controls keep their normal Space behaviour.
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code !== "Space" && e.key !== " ") return;
            const target = e.target as HTMLElement | null;
            if (target && target !== document.body && target.closest("input, textarea, select, button, a, [role], [contenteditable], [tabindex]")) {
                return;
            }
            e.preventDefault();
            iframeRef.current?.focus();
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    // Global shortcut event listeners
    useEffect(() => {
        const handleToggleTheater = () => setIsTheaterMode(prev => !prev);
        const handleReload = () => setPlayerKey(prev => prev + 1);
        const handleShareLink = () => handleShare();
        const handleSelectServer = (e: Event) => {
            const index = (e as CustomEvent).detail?.index;
            if (typeof index === "number" && index >= 0 && index < SERVERS.length) {
                setSelectedServer(index);
            }
        };

        window.addEventListener("playerToggleTheater", handleToggleTheater);
        window.addEventListener("playerReload", handleReload);
        window.addEventListener("playerShare", handleShareLink);
        window.addEventListener("playerSelectServer", handleSelectServer);

        return () => {
            window.removeEventListener("playerToggleTheater", handleToggleTheater);
            window.removeEventListener("playerReload", handleReload);
            window.removeEventListener("playerShare", handleShareLink);
            window.removeEventListener("playerSelectServer", handleSelectServer);
        };
    }, [selectedServer, currentSeason, currentEpisode, type, id]);

    const handleShare = () => {
        const shareUrl = `${window.location.origin}/watch/${type}/${id}?resume=true` +
            (type === 'tv' ? `&s=${currentSeason}&e=${currentEpisode}` : '') +
            `&server=${selectedServer}`;

        navigator.clipboard.writeText(shareUrl)
            .then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            })
            .catch((err) => {
                console.error("Failed to copy link: ", err);
            });
    };

    const currentServer = SERVERS[selectedServer] || SERVERS[0];
    const playerUrl = getPlayerUrl(selectedServer, type, id, currentSeason, currentEpisode);

    return (
        <div className="flex flex-col w-full h-full bg-black select-none">
            {/* Player Frame */}
            <div className={cn(
                "relative w-full aspect-[14/10] sm:aspect-video md:aspect-auto md:h-[82vh] bg-black overflow-hidden",
                isTheaterMode && "md:h-[94vh] z-40"
            )}>
                <iframe
                    ref={iframeRef}
                    key={frameKey}
                    src={playerUrl}
                    onLoad={() => setFrameLoaded(true)}
                    title={`${tmdbData?.title || tmdbData?.name || "Video"} player`}
                    className="w-full h-full border-none"
                    allowFullScreen
                    frameBorder="0"
                    scrolling="no"
                    referrerPolicy="origin"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    {...(currentServer.useSandbox ? { sandbox: "allow-forms allow-pointer-lock allow-same-origin allow-scripts allow-top-navigation" } : {})}
                />

                {/* Loading state for the source, then a hint if it never loads */}
                {!frameLoaded && (
                    <div className="pointer-events-none absolute inset-0 grid place-items-center bg-black" role="status" aria-live="polite">
                        <div className="flex flex-col items-center gap-3 px-6 text-center">
                            {!isSlow ? (
                                <>
                                    <span className="h-9 w-9 animate-spin rounded-full border-2 border-white/15 border-t-accent motion-reduce:animate-none" aria-hidden="true" />
                                    <p className="text-sm text-muted">Loading {currentServer.name}…</p>
                                </>
                            ) : (
                                <>
                                    <AlertCircle className="h-8 w-8 text-accent" aria-hidden="true" />
                                    <p className="max-w-sm text-sm text-muted">
                                        <strong className="text-white">{currentServer.name}</strong> is taking a long time to respond.
                                    </p>
                                    <div className="pointer-events-auto flex flex-wrap justify-center gap-2">
                                        <button type="button" onClick={() => setPlayerKey((k) => k + 1)} className="btn btn-sm btn-ghost">
                                            <RefreshCcw className="h-3.5 w-3.5" aria-hidden="true" /> Retry
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedServer((i) => (i + 1) % SERVERS.length)}
                                            className="btn btn-sm btn-primary"
                                        >
                                            Try {SERVERS[(selectedServer + 1) % SERVERS.length].name}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Playback Control & Source Bar */}
            <div className="border-b border-line bg-surface/95 px-4 sm:px-6 lg:px-8 py-3.5">
                <div className="flex flex-col gap-3.5 lg:flex-row lg:items-center lg:justify-between">
                    {/* Left: Title & Source Selector */}
                    <div className="min-w-0 flex-1 space-y-2.5">
                        <div className="flex items-center gap-3 min-w-0">
                            <span className="flex h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
                            <h1 className="truncate font-display text-base md:text-lg font-bold text-white">
                                {tmdbData?.title || tmdbData?.name}
                            </h1>
                            {type === "tv" && (
                                <span className="shrink-0 px-2.5 py-0.5 rounded-full bg-surface-2 border border-line text-xs font-semibold text-accent tabular-nums">
                                    S{currentSeason} : E{currentEpisode}
                                </span>
                            )}
                        </div>

                        {/* Video Source Chips */}
                        <div className="flex items-center gap-2.5 min-w-0">
                            <span className="hidden sm:inline-flex items-center gap-1.5 shrink-0 text-muted">
                                <Server className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                                <span className="text-[11px] font-bold uppercase tracking-[0.14em]">Source</span>
                            </span>

                            <div
                                ref={sourcesRef}
                                role="radiogroup"
                                aria-label="Streaming source server"
                                className="flex items-center gap-1.5 overflow-x-auto scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0 py-1"
                            >
                                {SERVERS.map((server, idx) => {
                                    const isSelected = selectedServer === idx;
                                    return (
                                        <button
                                            key={server.name}
                                            role="radio"
                                            aria-checked={isSelected}
                                            onClick={() => setSelectedServer(idx)}
                                            className={cn(
                                                "relative h-8 px-3.5 rounded-full text-xs font-semibold whitespace-nowrap flex items-center gap-1.5",
                                                isSelected
                                                    ? "bg-accent text-on-accent shadow-[0_0_16px_rgba(255,141,179,0.4)] font-bold scale-[1.02]"
                                                    : "bg-surface-2 border border-line text-gray-300 hover:text-white hover:border-line-strong hover:bg-surface-3"
                                            )}
                                        >
                                            {server.name}
                                            {server.badge && (
                                                <span className={cn(
                                                    "text-[9px] px-1 py-0.2 rounded font-bold uppercase tracking-wider",
                                                    isSelected ? "bg-black/20 text-on-accent" : "bg-accent/15 text-accent"
                                                )}>
                                                    {server.badge}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            <button
                                onClick={() => setShowSourceHint(prev => !prev)}
                                className="hidden md:inline-flex text-muted hover:text-white p-1"
                                title="Troubleshoot sources"
                                aria-label="Troubleshoot sources"
                                aria-expanded={showSourceHint}
                            >
                                <AlertCircle className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>

                    {/* Right: Episode Controls & Player Actions */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {type === "tv" && seasons.length > 0 && (
                            <div className="flex items-center gap-1.5 bg-surface-2 p-1 rounded-full border border-line">
                                <button
                                    onClick={handlePrevEpisode}
                                    disabled={currentSeason === 1 && currentEpisode === 1}
                                    className="h-7 w-7 rounded-full flex items-center justify-center text-muted hover:text-white disabled:opacity-30 disabled:pointer-events-none"
                                    title="Previous Episode"
                                    aria-label="Previous episode"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>

                                <Dropdown
                                    value={currentSeason}
                                    onChange={(val) => handleSeasonChange(Number(val))}
                                    options={seasons.map((s) => ({
                                        value: s.season_number,
                                        label: s.name || `Season ${s.season_number}`
                                    }))}
                                    className="h-7 px-3 text-[12px] bg-transparent border-none text-white font-medium"
                                    menuClassName="min-w-[160px]"
                                />

                                <span className="text-line-strong">/</span>

                                <Dropdown
                                    value={currentEpisode}
                                    onChange={(val) => handleEpisodeChange(Number(val))}
                                    options={Array.from(
                                        { length: episodeCount },
                                        (_, i) => ({ value: i + 1, label: `Ep ${i + 1}` })
                                    )}
                                    className="h-7 px-3 text-[12px] bg-transparent border-none text-white font-medium"
                                    menuClassName="min-w-[140px]"
                                />

                                <button
                                    onClick={handleNextEpisode}
                                    disabled={isLastEpisode}
                                    className="h-7 w-7 rounded-full flex items-center justify-center text-muted hover:text-white disabled:opacity-30 disabled:pointer-events-none"
                                    title="Next Episode"
                                    aria-label="Next episode"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}

                        {/* Reload Button */}
                        <button
                            onClick={() => setPlayerKey(prev => prev + 1)}
                            className="btn btn-sm btn-ghost px-3 text-muted hover:text-white"
                            title="Reload Stream Player"
                        >
                            <RefreshCcw className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline text-xs">Reload</span>
                        </button>

                        {/* Share Button */}
                        <button
                            onClick={handleShare}
                            className={cn(
                                "btn btn-sm btn-ghost px-3 text-muted hover:text-white",
                                copied && "bg-love/20 border-love text-love"
                            )}
                            title="Copy Direct Playback Link"
                        >
                            {copied ? <Check className="h-3.5 w-3.5 text-love" /> : <Share2 className="h-3.5 w-3.5" />}
                            <span className="text-xs">{copied ? "Copied!" : "Share"}</span>
                        </button>

                        {/* Theater Mode Toggle */}
                        <button
                            onClick={() => setIsTheaterMode(!isTheaterMode)}
                            aria-pressed={isTheaterMode}
                            className="hidden md:inline-flex btn btn-sm btn-ghost px-3 text-muted hover:text-white"
                            title={isTheaterMode ? "Exit Theater Mode" : "Enter Theater Mode"}
                        >
                            {isTheaterMode ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                            <span className="text-xs">{isTheaterMode ? "Exit Theater" : "Theater"}</span>
                        </button>
                    </div>
                </div>

                {/* Helpful Troubleshoot banner if user clicks or toggle */}
                {showSourceHint && (
                    <div className="mt-2.5 p-2.5 rounded-xl bg-surface-2 border border-line text-xs text-muted flex items-center justify-between">
                        <span>
                            💡 <strong className="text-white">Stream tip:</strong> If the current video source is buffering or unavailable, tap another server above like <strong className="text-accent">Filmu</strong>, <strong className="text-accent">PrimeSRC</strong>, or <strong className="text-accent">Vidfast</strong>.
                        </span>
                        <button onClick={() => setShowSourceHint(false)} className="text-muted hover:text-white ml-2 text-xs font-semibold">
                            Dismiss
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
