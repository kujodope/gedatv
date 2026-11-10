"use client";

import React, { useState, useEffect } from "react";
import MovieCard from "@/components/MovieCard";
import PageHeader from "@/components/PageHeader";
import { useLibrary, lib, selectActiveProfile } from "@/lib/library";
import type { Movie } from "@/lib/tmdb";
import {
    Heart,
    Bookmark,
    Sparkles,
    Calendar,
    Download,
    Upload,
    Check,
    Plus,
    Film,
    Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function CoupleSpacePage() {
    const activeProfile = useLibrary(selectActiveProfile);
    const profiles = useLibrary((s) => s.profiles);
    const couple = useLibrary((s) => s.couple);
    const personalData = useLibrary((s) => s.data[s.activeProfile]);

    const [activeTab, setActiveTab] = useState<"favourites" | "together" | "plans" | "backup">("favourites");
    const [copied, setCopied] = useState(false);
    const [importJson, setImportJson] = useState("");
    const [importSuccess, setImportSuccess] = useState<boolean | null>(null);

    useEffect(() => {
        document.title = "Our Space | GedaTv";
    }, []);

    // Date plan input state
    const [planNote, setPlanNote] = useState("");
    const [planDate, setPlanDate] = useState("");

    // Map couple favourites or profile favourites
    const favItems = couple.ourFavourites.length > 0
        ? couple.ourFavourites
        : (personalData?.favourites || []);

    const favMovies: Movie[] = favItems.map((item) => ({
        id: parseInt(item.id),
        title: item.title,
        name: item.title,
        overview: item.overview || "",
        poster_path: item.poster_path || undefined,
        backdrop_path: item.backdrop_path || undefined,
        vote_average: item.vote_average,
        release_date: item.release_date,
        first_air_date: item.first_air_date,
        media_type: item.type,
    }));

    // Watched together items
    const togetherItems = couple.together.filter((i) => i.watchedAt);
    const togetherMovies: Movie[] = togetherItems.map((item) => ({
        id: parseInt(item.id),
        title: item.title,
        name: item.title,
        overview: item.overview || "",
        poster_path: item.poster_path || undefined,
        backdrop_path: item.backdrop_path || undefined,
        vote_average: item.vote_average,
        release_date: item.release_date,
        first_air_date: item.first_air_date,
        media_type: item.type,
    }));

    const handleExport = () => {
        const json = lib.exportJSON();
        navigator.clipboard.writeText(json).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const handleImport = () => {
        if (!importJson.trim()) return;
        const success = lib.importJSON(importJson.trim());
        setImportSuccess(success);
        if (success) {
            setImportJson("");
            setTimeout(() => setImportSuccess(null), 3000);
        }
    };

    return (
        <main className="min-h-screen pb-24">
            <div className="page-top page-gutter max-w-7xl mx-auto">
                {/* Romantic Header */}
                <div className="relative rounded-3xl overflow-hidden p-6 sm:p-8 md:p-10 mb-8 border border-line bg-gradient-to-br from-surface via-surface-2 to-surface-3 shadow-2xl">
                    <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-accent/15 blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-love/15 blur-3xl pointer-events-none" />

                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/15 border border-accent/30 text-xs font-bold text-accent uppercase tracking-wider mb-3">
                                <Heart className="w-3.5 h-3.5 fill-accent" />
                                <span>Our Little Movie World</span>
                            </div>
                            <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                                Us &amp; Cinema 💕
                            </h1>
                            <p className="mt-2 text-sm sm:text-base text-muted max-w-xl leading-relaxed">
                                A personal sanctuary made exclusively for the two of you. Track your shared favorites, plan cozy date nights, and keep your movie memories forever.
                            </p>
                        </div>

                        {/* Profile cards switcher */}
                        <div className="flex items-center gap-3 bg-surface/80 p-2 rounded-2xl border border-line shrink-0">
                            {profiles.map((p) => {
                                const isCurrent = p.id === activeProfile.id;
                                return (
                                    <button
                                        key={p.id}
                                        onClick={() => lib.setActiveProfile(p.id)}
                                        className={cn(
                                            "flex items-center gap-2.5 px-4 py-2.5 rounded-xl",
                                            isCurrent
                                                ? "bg-accent text-on-accent font-bold shadow-[0_4px_16px_rgba(255,141,179,0.35)] scale-105"
                                                : "text-muted hover:text-white hover:bg-surface-2"
                                        )}
                                    >
                                        <span className="text-xl select-none">{p.avatar}</span>
                                        <div className="text-left">
                                            <div className="text-xs font-bold leading-tight">{p.name}</div>
                                            <div className={cn("text-[10px]", isCurrent ? "text-on-accent/80" : "text-subtle")}>
                                                {isCurrent ? "Active" : "Switch"}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="relative z-10 flex items-center gap-2 mt-8 overflow-x-auto scrollbar-none border-t border-line pt-6">
                        <button
                            onClick={() => setActiveTab("favourites")}
                            className={cn(
                                "flex items-center gap-2 h-10 px-5 rounded-full text-xs sm:text-sm font-semibold shrink-0",
                                activeTab === "favourites"
                                    ? "bg-love text-white shadow-[0_4px_16px_rgba(244,63,94,0.4)]"
                                    : "bg-surface-2 border border-line text-muted hover:text-white"
                            )}
                        >
                            <Heart className={cn("w-4 h-4", activeTab === "favourites" && "fill-white")} />
                            <span>Our Favourites ({favMovies.length})</span>
                        </button>

                        <button
                            onClick={() => setActiveTab("together")}
                            className={cn(
                                "flex items-center gap-2 h-10 px-5 rounded-full text-xs sm:text-sm font-semibold shrink-0",
                                activeTab === "together"
                                    ? "bg-accent text-on-accent font-bold shadow-[0_4px_16px_rgba(255,141,179,0.4)]"
                                    : "bg-surface-2 border border-line text-muted hover:text-white"
                            )}
                        >
                            <Sparkles className="w-4 h-4" />
                            <span>Watched Together ({togetherMovies.length})</span>
                        </button>

                        <button
                            onClick={() => setActiveTab("plans")}
                            className={cn(
                                "flex items-center gap-2 h-10 px-5 rounded-full text-xs sm:text-sm font-semibold shrink-0",
                                activeTab === "plans"
                                    ? "bg-lavender text-ink font-bold shadow-[0_4px_16px_rgba(196,181,253,0.4)]"
                                    : "bg-surface-2 border border-line text-muted hover:text-white"
                            )}
                        >
                            <Calendar className="w-4 h-4" />
                            <span>Movie Date Plans ({couple.plans.length})</span>
                        </button>

                        <button
                            onClick={() => setActiveTab("backup")}
                            className={cn(
                                "flex items-center gap-2 h-10 px-5 rounded-full text-xs sm:text-sm font-semibold shrink-0",
                                activeTab === "backup"
                                    ? "bg-surface-3 text-white border-line-strong"
                                    : "bg-surface-2 border border-line text-muted hover:text-white"
                            )}
                        >
                            <Download className="w-4 h-4" />
                            <span>Sync &amp; Backup</span>
                        </button>
                    </div>
                </div>

                {/* Tab 1: Our Favourites */}
                {activeTab === "favourites" && (
                    <div>
                        {favMovies.length === 0 ? (
                            <div className="surface p-12 sm:p-16 text-center max-w-lg mx-auto">
                                <div className="grid h-16 w-16 place-items-center rounded-2xl bg-love/15 border border-love/30 text-love mx-auto mb-4">
                                    <Heart className="h-8 w-8 fill-love" />
                                </div>
                                <h3 className="font-display text-xl font-bold text-white">No favourites saved yet</h3>
                                <p className="mt-2 text-sm text-muted">
                                    Tap the heart icon on any movie or anime to mark it as one of our all-time favorites!
                                </p>
                                <div className="mt-6 flex justify-center gap-3">
                                    <Link href="/movies" className="btn btn-primary btn-sm">Explore Movies</Link>
                                    <Link href="/anime" className="btn btn-ghost btn-sm">Explore Anime</Link>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
                                {favMovies.map((movie) => (
                                    <MovieCard key={`${movie.id}-${movie.media_type}`} movie={movie} isFluid={true} />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Tab 2: Watched Together */}
                {activeTab === "together" && (
                    <div>
                        {togetherMovies.length === 0 ? (
                            <div className="surface p-12 sm:p-16 text-center max-w-lg mx-auto">
                                <div className="grid h-16 w-16 place-items-center rounded-2xl bg-accent/15 border border-accent/30 text-accent mx-auto mb-4">
                                    <Sparkles className="h-8 w-8" />
                                </div>
                                <h3 className="font-display text-xl font-bold text-white">No watched memories yet</h3>
                                <p className="mt-2 text-sm text-muted">
                                    When you finish watching a film together, tap the &quot;Watched Together&quot; stamp on the movie details page to record your cozy memory here.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
                                {togetherMovies.map((movie) => (
                                    <MovieCard key={`${movie.id}-${movie.media_type}`} movie={movie} isFluid={true} />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Tab 3: Date Night Plans */}
                {activeTab === "plans" && (
                    <div className="space-y-6">
                        {/* New Plan Creator */}
                        <div className="surface p-6 sm:p-8 max-w-2xl mx-auto space-y-4">
                            <h3 className="font-display text-lg font-bold text-white flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-accent" />
                                <span>Plan Our Next Movie Date</span>
                            </h3>
                            <p className="text-xs text-muted">
                                Add a title to your watchlist and schedule a cozy movie night together!
                            </p>

                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-semibold text-muted mb-1">Date &amp; Time</label>
                                    <input
                                        type="datetime-local"
                                        value={planDate}
                                        onChange={(e) => setPlanDate(e.target.value)}
                                        className="field text-xs"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-muted mb-1">Cute Note (e.g. snack order, mood)</label>
                                    <input
                                        type="text"
                                        placeholder="Order sushi, light candles, and snuggle up under the blanket 💕"
                                        value={planNote}
                                        onChange={(e) => setPlanNote(e.target.value)}
                                        className="field text-xs"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Existing Plans */}
                        {couple.plans.length === 0 ? (
                            <div className="surface p-10 text-center text-muted max-w-lg mx-auto">
                                <Calendar className="w-8 h-8 text-subtle mx-auto mb-2" />
                                <p className="text-xs">No upcoming movie dates scheduled yet.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
                                {couple.plans.map((plan) => (
                                    <div key={plan.id} className="surface p-5 flex items-start justify-between gap-4 border-line-strong hover:border-accent/40">
                                        <div className="space-y-1.5 min-w-0">
                                            <div className="flex items-center gap-2 text-xs font-bold text-accent">
                                                <Calendar className="w-3.5 h-3.5" />
                                                <span>{new Date(plan.when).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                                            </div>
                                            <h4 className="font-bold text-base text-white truncate">{plan.item.title}</h4>
                                            {plan.note && <p className="text-xs text-muted italic">&ldquo;{plan.note}&rdquo;</p>}
                                        </div>
                                        <button
                                            onClick={() => lib.removePlan(plan.id)}
                                            className="text-subtle hover:text-love p-1.5"
                                            title="Delete plan"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Tab 4: Sync & Backup Tool */}
                {activeTab === "backup" && (
                    <div className="surface p-6 sm:p-8 max-w-2xl mx-auto space-y-6">
                        <div>
                            <h3 className="font-display text-lg font-bold text-white flex items-center gap-2">
                                <Download className="w-5 h-5 text-accent" />
                                <span>Export &amp; Share Our Watchlist</span>
                            </h3>
                            <p className="mt-1 text-xs text-muted">
                                Seamlessly move your shared watchlist and favourites between your phone, laptop, or tablet with zero hassle.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <button onClick={handleExport} className="btn btn-primary flex-1">
                                {copied ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                                <span>{copied ? "Copied JSON to Clipboard!" : "Copy All Data to Clipboard"}</span>
                            </button>
                        </div>

                        <div className="border-t border-line pt-5 space-y-3">
                            <h4 className="font-bold text-sm text-white flex items-center gap-2">
                                <Upload className="w-4 h-4 text-lavender" />
                                <span>Import Data from Partner</span>
                            </h4>
                            <textarea
                                value={importJson}
                                onChange={(e) => setImportJson(e.target.value)}
                                placeholder="Paste exported JSON here to restore our shared list..."
                                rows={4}
                                className="w-full rounded-xl bg-surface-2 border border-line p-3 text-xs text-white font-mono placeholder:text-subtle outline-none focus:border-accent"
                            />
                            <button
                                onClick={handleImport}
                                disabled={!importJson.trim()}
                                className="btn btn-ghost btn-sm"
                            >
                                Restore Data
                            </button>

                            {importSuccess === true && (
                                <p className="text-xs font-semibold text-emerald-400">
                                    ✨ Successfully imported! Your couple library is up to date.
                                </p>
                            )}
                            {importSuccess === false && (
                                <p className="text-xs font-semibold text-rose-400">
                                    ⚠️ Invalid JSON data. Please check what was pasted.
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
