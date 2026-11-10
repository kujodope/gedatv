import React from "react";
import { HeroSkeleton, MovieRowSkeleton } from "@/components/Skeleton";

export default function Loading() {
    return (
        <main className="min-h-screen overflow-hidden" aria-busy="true">
            <HeroSkeleton />
            <div className="relative z-10 pt-6 md:-mt-8 lg:-mt-12 space-y-10 md:space-y-14">
                <MovieRowSkeleton />
                <MovieRowSkeleton />
                <MovieRowSkeleton />
            </div>
        </main>
    );
}
