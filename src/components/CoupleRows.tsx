"use client";

import React from "react";
import MovieRow from "./MovieRow";
import { useLibrary, selectActiveProfile, type SavedItem } from "@/lib/library";
import type { Movie } from "@/lib/tmdb";
import { toListMovie } from "@/lib/myList";
import { Heart, Bookmark } from "lucide-react";

// Selectors must return stable references; a fresh [] would re-render forever
const EMPTY: SavedItem[] = [];

export default function CoupleRows() {
    const activeProfile = useLibrary(selectActiveProfile);
    const watchlist = useLibrary((s) => s.data[s.activeProfile]?.watchlist ?? EMPTY);
    const favourites = useLibrary((s) => s.data[s.activeProfile]?.favourites ?? EMPTY);
    const ourFavourites = useLibrary((s) => s.couple.ourFavourites ?? EMPTY);

    const watchlistMovies: Movie[] = watchlist.map(toListMovie);

    // Combine couple favourites and profile favourites, deduped
    const favList = ourFavourites.length > 0 ? ourFavourites : favourites;
    const favMovies: Movie[] = favList.map(toListMovie);

    return (
        <>
            {/* Our Watchlist Row */}
            {watchlistMovies.length > 0 && (
                <div>
                    <MovieRow
                        title="Our Watchlist"
                        subtitle={`Saved by ${activeProfile.name} to watch together`}
                        movies={watchlistMovies}
                        seeAllUrl="/watchlist"
                        icon={<Bookmark className="w-5 h-5 text-accent" />}
                        badge="Shared"
                    />
                </div>
            )}

            {/* Our Favourite Movies Row */}
            {favMovies.length > 0 && (
                <div>
                    <MovieRow
                        title="Our Favourite Movies"
                        subtitle="The films and stories that hold a special place in our hearts"
                        movies={favMovies}
                        seeAllUrl="/us"
                        icon={<Heart className="w-5 h-5 text-love fill-love" />}
                        badge="Loved"
                    />
                </div>
            )}
        </>
    );
}
