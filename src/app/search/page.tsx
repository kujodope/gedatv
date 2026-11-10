import { Suspense } from "react";
import type { Metadata } from "next";
import { tmdb } from "@/lib/tmdb";
import { CardGridSkeleton, Skeleton } from "@/components/Skeleton";
import SearchClient from "./SearchClient";

export const metadata: Metadata = {
    title: "Search",
    description: "Search movies, TV shows, anime, people and studios on GedaTv.",
};

// The page itself is static and served from the CDN; only the results for
// ?q= are fetched in the browser (from the cached /api/search route)
export const revalidate = 3600;

export default async function SearchPage() {
    // Shown before anything is typed. Fetched here, in parallel, and sent
    // with the page, instead of two requests from the browser after it loads.
    const [trending, genres] = await Promise.all([
        tmdb.getTrending("all"),
        tmdb.getGenreList("movie"),
    ]);

    return (
        <main className="min-h-screen pb-16">
            <div className="page-top page-gutter">
                {/* ?q= is only known in the browser */}
                <Suspense
                    fallback={
                        <>
                            <Skeleton className="mb-10 h-12 w-80 max-w-full rounded-xl" />
                            <CardGridSkeleton count={15} label="Loading results" />
                        </>
                    }
                >
                    <SearchClient
                        trending={trending.slice(0, 15)}
                        genres={genres.slice(0, 12).map((g: { id: number; name: string }) => ({ id: g.id, name: g.name }))}
                    />
                </Suspense>
            </div>

            {/* SEO Rich Text Content Section */}
            <div className="page-gutter mt-20 md:mt-28 border-t border-line pt-14 pb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start text-gray-400">
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-white">Advanced Search Features</h2>
                        <p className="leading-relaxed">
                            GedaTv's powerful search engine allows you to find your favorite entertainment in seconds. 
                            Our deep integration with the TMDB database means you can search not just by movie or TV show titles, but also by actors, directors, production companies, and specific genres.
                        </p>
                        <p className="leading-relaxed">
                            Whether you're looking for the latest "Trending Now" titles or a specific hidden gem from decades ago, our search tool provides accurate, lightning-fast results. 
                            Use the category filters to narrow down your search and find exactly what you're looking for, whether it's a feature film, a multi-season TV series, or information about your favorite actor.
                        </p>
                    </div>
                    <div className="surface p-6 md:p-8 space-y-6">
                        <h3 className="text-lg font-bold text-white mb-4">Search Tips</h3>
                        <ul className="space-y-4 text-sm leading-relaxed list-disc pl-4">
                            <li>
                                <strong className="text-white">Use Keywords:</strong> Instead of full titles, try using key words to find related matches more broadly.
                            </li>
                            <li>
                                <strong className="text-white">Filter by Type:</strong> Switch between Movies, TV Shows, and People tabs to refine your results efficiently.
                            </li>
                            <li>
                                <strong className="text-white">Discover Genres:</strong> Click on the genre badges to explore entire categories of content similar to your favorites.
                            </li>
                            <li>
                                <strong className="text-white">Cast & Crew:</strong> Search for actors to see their full filmography and discover their other works.
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </main>
    );
}
