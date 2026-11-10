import React from "react";
import { Play, ChevronLeft, ChevronRight, Tv } from "lucide-react";
import { cn } from "@/lib/utils";
import { tmdbImage, backdropSrcSet } from "@/lib/images";
import Dropdown from "@/components/ui/Dropdown";

interface Episode {
    id: number;
    name: string;
    episode_number: number;
    season_number: number;
    still_path: string | null;
    overview: string;
    runtime: number;
    air_date: string;
}

interface SeasonItem {
    season_number: number;
    name?: string;
    episode_count?: number;
}

interface EpisodeListProps {
    episodes: Episode[];
    currentSeason: number;
    currentEpisode: number;
    onEpisodeSelect: (episode: number) => void;
    isPlaying?: boolean;
    seasons?: SeasonItem[];
    onSeasonChange?: (season: number) => void;
}

export default function EpisodeList({
    episodes,
    currentSeason,
    currentEpisode,
    onEpisodeSelect,
    isPlaying = false,
    seasons,
    onSeasonChange
}: EpisodeListProps) {
    const activeEpisode = episodes.find((ep) => ep.episode_number === currentEpisode) || episodes[0] || null;

    return (
        <div className="space-y-10">
            {/* Now playing episode */}
            {activeEpisode && isPlaying && (
                <div className="surface overflow-hidden">
                    <div className="flex flex-col lg:flex-row">
                        <div className="relative w-full lg:w-[420px] aspect-video shrink-0 bg-surface-2">
                            {activeEpisode.still_path ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={tmdbImage("w780", activeEpisode.still_path)}
                                    srcSet={backdropSrcSet(activeEpisode.still_path)}
                                    sizes="(min-width: 1024px) 420px, 100vw"
                                    decoding="async"
                                    alt=""
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="grid h-full w-full place-items-center text-subtle">
                                    <Tv className="h-10 w-10" aria-hidden="true" />
                                </div>
                            )}
                            <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg">
                                <span className="h-1.5 w-1.5 rounded-full bg-white" aria-hidden="true" />
                                Now playing
                            </span>
                        </div>

                        <div className="flex-1 p-6 md:p-8">
                            <p className="eyebrow mb-2">
                                Season {currentSeason} · Episode {activeEpisode.episode_number}
                                {activeEpisode.runtime > 0 && <> · {activeEpisode.runtime} min</>}
                                {activeEpisode.air_date && <> · {activeEpisode.air_date}</>}
                            </p>
                            <h2 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-white">
                                {activeEpisode.name}
                            </h2>
                            <p className="mt-3 max-w-3xl text-sm md:text-[15px] leading-relaxed text-gray-300">
                                {activeEpisode.overview || "No description available for this episode."}
                            </p>

                            <div className="mt-6 flex flex-wrap items-center gap-2.5">
                                <button
                                    disabled={activeEpisode.episode_number <= 1}
                                    onClick={() => onEpisodeSelect(activeEpisode.episode_number - 1)}
                                    className="btn btn-sm btn-ghost"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    Previous
                                </button>
                                <button
                                    disabled={activeEpisode.episode_number >= episodes.length}
                                    onClick={() => onEpisodeSelect(activeEpisode.episode_number + 1)}
                                    className="btn btn-sm btn-primary"
                                >
                                    Next episode
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* List of Season Episodes */}
            <div>
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        {seasons && seasons.length > 1 ? (
                            <Dropdown
                                value={currentSeason}
                                onChange={(val) => onSeasonChange?.(Number(val))}
                                options={seasons.map((s) => ({
                                    value: s.season_number,
                                    label: s.name || `Season ${s.season_number}`
                                }))}
                                className="h-10 px-4 text-base font-bold bg-surface-2 border-line hover:border-line-strong"
                                menuClassName="min-w-[180px]"
                            />
                        ) : (
                            <h2 className="font-display text-xl md:text-2xl font-bold text-white">Season {currentSeason}</h2>
                        )}
                        <span className="text-sm font-medium text-subtle tabular-nums">{episodes.length} episodes</span>
                    </div>
                </div>

                <ol className="grid grid-cols-1 gap-2">
                    {episodes.map((ep) => {
                        const isCurrent = ep.episode_number === currentEpisode;
                        return (
                            <li key={ep.id}>
                                <button
                                    type="button"
                                    onClick={() => onEpisodeSelect(ep.episode_number)}
                                    aria-current={isCurrent ? "true" : undefined}
                                    className={cn(
                                        "group w-full text-left flex flex-col sm:flex-row sm:items-center gap-4 p-3 rounded-2xl border",
                                        isCurrent
                                            ? "bg-white/[0.06] border-line-strong"
                                            : "border-transparent hover:bg-white/[0.04] hover:border-line"
                                    )}
                                >
                                    <span className="hidden sm:block w-8 shrink-0 text-center font-display text-2xl font-bold tabular-nums text-subtle group-hover:text-gray-300">
                                        {ep.episode_number}
                                    </span>
                                    <div className="relative w-full sm:w-52 md:w-60 aspect-video shrink-0 overflow-hidden rounded-xl bg-surface-2 ring-1 ring-white/[0.06]">
                                        {ep.still_path ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={tmdbImage("w500", ep.still_path)}
                                                srcSet={backdropSrcSet(ep.still_path)}
                                                sizes="(min-width: 768px) 240px, (min-width: 640px) 208px, 100vw"
                                                loading="lazy"
                                                decoding="async"
                                                alt=""
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="grid h-full w-full place-items-center text-subtle">
                                                <Tv className="h-8 w-8" aria-hidden="true" />
                                            </div>
                                        )}
                                        <div className={cn(
                                            "absolute inset-0 grid place-items-center bg-black/35",
                                            isCurrent ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                        )}>
                                            <span className="grid h-10 w-10 place-items-center rounded-full bg-white/95 text-ink shadow-lg">
                                                <Play className="h-4 w-4 fill-current translate-x-px" />
                                            </span>
                                        </div>
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between gap-3">
                                            <h3 className="font-sans text-[15px] font-semibold tracking-normal text-white line-clamp-1">
                                                <span className="sm:hidden">{ep.episode_number}. </span>
                                                {ep.name || `Episode ${ep.episode_number}`}
                                            </h3>
                                            {ep.runtime > 0 && <span className="shrink-0 text-xs text-muted tabular-nums">{ep.runtime} min</span>}
                                        </div>
                                        {ep.air_date && <p className="mt-0.5 text-xs text-subtle">{ep.air_date}</p>}
                                        <p className="mt-1.5 text-sm leading-relaxed text-gray-400 line-clamp-2">
                                            {ep.overview || "No description available."}
                                        </p>
                                        {isCurrent && (
                                            <span className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-accent">
                                                <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
                                                {isPlaying ? "Playing" : "Up next"}
                                            </span>
                                        )}
                                    </div>
                                </button>
                            </li>
                        );
                    })}
                </ol>
            </div>
        </div>
    );
}
