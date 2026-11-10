import { tmdb } from "@/lib/tmdb";
import MovieCard from "@/components/MovieCard";
import PageHeader from "@/components/PageHeader";
import Link from "next/link";

interface GenrePageProps {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ name: string; type: "movie" | "tv" }>;
}

export async function generateMetadata({ searchParams }: GenrePageProps) {
    const { name, type } = await searchParams;
    const genreName = name || "Genre";
    const typeLabel = type === "tv" ? "TV Shows" : "Movies";
    
    return {
        title: `${genreName} ${typeLabel}`,
        description: `Browse the best ${genreName} ${typeLabel.toLowerCase()} on GedaTv. Watch now for free in HD.`,
    };
}

export default async function GenrePage({ params, searchParams }: GenrePageProps) {
    const resolvedParams = await params;
    const resolvedSearchParams = await searchParams;
    const genreId = resolvedParams.id;
    const genreName = resolvedSearchParams.name || "Genre";
    const type = resolvedSearchParams.type || "movie";

    const movies = await tmdb.getDiscover(type, { genreId });

    return (
        <main className="min-h-screen page-top pb-20 overflow-x-hidden">
            <div className="page-gutter">
                <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted">
                    <Link href="/categories" className="hover:text-white">Categories</Link>
                    <span className="mx-2 text-subtle" aria-hidden="true">/</span>
                    <span className="text-gray-300">{genreName}</span>
                </nav>
                <PageHeader
                    eyebrow={type === "movie" ? "Movies" : "TV Shows"}
                    title={genreName}
                    description={`The most popular ${genreName.toLowerCase()} ${type === "movie" ? "films" : "series"} right now.`}
                    aside={movies.length > 0 ? <span className="text-sm text-muted tabular-nums">{movies.length} titles</span> : undefined}
                />

                {movies && movies.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-3 gap-y-5 sm:gap-x-4 sm:gap-y-6">
                        {movies.map((movie) => (
                            <MovieCard key={movie.id} movie={movie} isFluid={true} />
                        ))}
                    </div>
                ) : (
                    <div className="surface flex flex-col items-center justify-center px-6 py-20 text-center">
                        <p className="font-display text-xl font-bold text-white">Nothing here yet</p>
                        <p className="mt-1 text-sm text-muted">No titles were found for this category.</p>
                        <Link href="/categories" className="btn btn-sm btn-ghost mt-6">Browse all categories</Link>
                    </div>
                )}
            </div>
        </main>
    );
}
