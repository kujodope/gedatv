"use client";

import { addToWatchlist, removeFromWatchlist } from "@/lib/storage";
import { lib, selectData, useLibrary, type MediaType, type SavedItem, type TitleRef } from "@/lib/library";
import type { Movie } from "@/lib/tmdb";

/*
 * "My List" reads from the profile-aware library (gedatv_v3) so the list
 * page, the home row, the navbar and the couple space all agree. Writes are
 * mirrored to the older gedatv_watchlist key, which keeps both stores in
 * step for anything still reading it and for a rollback to a previous build.
 */
export function setInMyList(title: TitleRef, present: boolean) {
    lib.set("watchlist", title, present);
    if (present) {
        addToWatchlist({ ...title, poster_path: title.poster_path || "", backdrop_path: title.backdrop_path || undefined });
    } else {
        removeFromWatchlist(title.id, title.type);
    }
}

export const isInMyList = (type: string, id: string | number) => lib.has("watchlist", type, id);

/** Live membership of one title in a personal list (updates across components and tabs). */
export function useInList(list: "watchlist" | "favourites", type: MediaType, id: string) {
    return useLibrary((s) => selectData(s)[list].some((i) => i.type === type && i.id === id));
}

/** Saved library item -> the list shape MovieCard and MovieRow render. */
export const toListMovie = (item: SavedItem): Movie => ({
    id: Number(item.id),
    title: item.title,
    name: item.title,
    overview: item.overview || "",
    poster_path: item.poster_path || undefined,
    backdrop_path: item.backdrop_path || undefined,
    vote_average: item.vote_average || 0,
    release_date: item.release_date,
    first_air_date: item.first_air_date,
    media_type: item.type,
});
