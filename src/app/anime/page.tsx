import React from "react";
import MovieCard from "@/components/MovieCard";
import PageHeader from "@/components/PageHeader";
import { tmdb } from "@/lib/tmdb";
import { Metadata } from "next";
import { Sparkles, Heart } from "lucide-react";

export const metadata: Metadata = {
  title: "Anime Collection",
  description: "Immerse yourself in Japanese animated masterpieces, fantasy epics, and heartfelt romances on GedaTv.",
};

export const revalidate = 3600;

export default async function AnimePage() {
  const [topAnime, popularAnime] = await Promise.all([
    tmdb.getAnime(1),
    tmdb.getAnime(2),
  ]);

  const allAnime = [...topAnime, ...popularAnime];

  return (
    <main className="min-h-screen pb-20">
      <div className="page-top page-gutter">
        <PageHeader
          eyebrow="Japanese Animation"
          title="Anime Sanctuary"
          description="Enchanting animation, breathtaking fantasy, and heartfelt love stories. Curated for cozy movie dates."
          aside={
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-2 border border-line text-xs font-semibold text-lavender">
              <Sparkles className="w-4 h-4 text-accent" />
              <span>{allAnime.length} Titles Available</span>
            </div>
          }
        />

        {allAnime.length === 0 ? (
          <div className="surface p-12 text-center text-muted">
            <Sparkles className="w-8 h-8 text-accent mx-auto mb-3" />
            <p>Loading anime catalogue...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
            {allAnime.map((movie) => (
              <MovieCard
                key={`${movie.id}-${movie.media_type}`}
                movie={movie}
                isFluid={true}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
