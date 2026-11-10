"use client";

import React, { useEffect, useState } from "react";
import { getRecentlyPlayed, removeFromRecentlyPlayed, RecentItem } from "@/lib/storage";
import { lib } from "@/lib/library";
import MovieRow from "./MovieRow";
import type { Movie } from "@/lib/tmdb";

const RecentlyPlayedRow = () => {
    const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
    const [isMounted, setIsMounted] = useState(false);

    const loadRecent = () => {
        const items = getRecentlyPlayed();
        setRecentItems(items);
    };

    useEffect(() => {
        setIsMounted(true);
        loadRecent();
        // Listen for updates from other components
        window.addEventListener("recentlyPlayedUpdated", loadRecent);
        return () => window.removeEventListener("recentlyPlayedUpdated", loadRecent);
    }, []);

    const handleRemove = (id: string, type: string) => {
        const targetId = String(id).trim();
        // Optimistically remove immediately from local state for instant, snappy UI feedback
        setRecentItems(prev => prev.filter(item => !(String(item.id).trim() === targetId && (item.type === type || !type))));
        // Persist removal in localStorage
        removeFromRecentlyPlayed(id, type);
        // Also remove from library history if recorded
        lib.removeFromHistory(type, targetId);
    };

    if (!isMounted || recentItems.length === 0) return null;

    // Map RecentItem to Movie type for MovieRow
    const movies: Movie[] = recentItems.map(item => ({
        id: Number(item.id) || (item.id as unknown as number),
        title: item.title,
        name: item.title,
        overview: item.overview || "",
        poster_path: item.poster_path || "",
        backdrop_path: item.backdrop_path || "",
        vote_average: item.vote_average || 0,
        release_date: item.release_date || item.first_air_date, // Fallback
        first_air_date: item.first_air_date || item.release_date, // Fallback
        media_type: ((item.type as string) === "series" ? "tv" : item.type) as "movie" | "tv",
        season: item.season,
        episode: item.episode,
        tagline: item.tagline,
    }));

    return (
        <div>
            <MovieRow
                title="Continue Watching"
                subtitle="Pick up where you left off"
                movies={movies}
                isResume={true}
                onRemove={handleRemove}
            />
        </div>
    );
};

export default RecentlyPlayedRow;
