"use client";

import React from "react";
import MovieCard from "./MovieCard";
import type { Movie } from "@/lib/tmdb";

interface SearchGridProps {
    results: Movie[];
}



const SearchGrid = ({ results }: SearchGridProps) => {
    return (
        <div
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-3 gap-y-5 sm:gap-x-4 sm:gap-y-6"
        >
            {results.map((movie) => (
                <div key={`${movie.id}-${movie.media_type}`}>
                    <MovieCard movie={movie} isFluid={true} />
                </div>
            ))}
        </div>
    );
};

export default SearchGrid;
