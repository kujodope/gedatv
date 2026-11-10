import { tmdb } from "@/lib/tmdb";
import MovieRow from "@/components/MovieRow";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Movie & TV Genres",
    description: "Browse through a wide range of movie and TV show categories on GedaTv.",
    alternates: {
        canonical: "https://gedatv.netlify.app/categories",
    },
};

export default async function CategoriesPage() {
    const [movieGenres, tvGenres] = await Promise.all([
        tmdb.getGenreList("movie"),
        tmdb.getGenreList("tv"),
    ]);

    // Fetch some initial data for a few categories to make it look full
    const [action, comedy, drama, animation] = await Promise.all([
        tmdb.getDiscover("movie", { genreId: "28" }),
        tmdb.getDiscover("movie", { genreId: "35" }),
        tmdb.getDiscover("tv", { genreId: "18" }),
        tmdb.getDiscover("movie", { genreId: "16" }),
    ]);

    const genreSections = [
        { title: "Movie genres", type: "movie" as const, genres: movieGenres.slice(0, 18) },
        { title: "TV series genres", type: "tv" as const, genres: tvGenres.slice(0, 18) },
    ];

    return (
        <main className="min-h-screen page-top pb-16 overflow-x-hidden">
            <div className="page-gutter">
                <PageHeader
                    eyebrow="Browse"
                    title="Categories"
                    description="Find exactly the kind of story you're in the mood for, across films and series."
                />

                {genreSections.map((section) => section.genres.length > 0 && (
                    <section key={section.type} className="mb-14" aria-labelledby={`genres-${section.type}`}>
                        <h2 id={`genres-${section.type}`} className="eyebrow mb-4 font-sans">{section.title}</h2>
                        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2.5 sm:gap-3">
                            {section.genres.map((genre: any) => (
                                <li key={genre.id}>
                                    <Link
                                        href={`/categories/${genre.id}?name=${encodeURIComponent(genre.name)}&type=${section.type}`}
                                        className="group relative flex h-20 sm:h-24 items-end overflow-hidden rounded-xl border border-line bg-gradient-to-br from-surface-2 to-surface p-4 hover:border-line-strong"
                                    >
                                        <span
                                            aria-hidden="true"
                                            className="absolute -right-6 -top-10 h-24 w-24 rounded-full blur-2xl opacity-40 group-hover:opacity-80"
                                            style={{ background: `hsl(${(genre.id * 47) % 360} 70% 55% / 0.5)` }}
                                        />
                                        <span className="relative font-display text-[15px] sm:text-base font-bold text-gray-200 group-hover:text-white">
                                            {genre.name}
                                        </span>
                                        <ChevronRight aria-hidden="true" className="absolute right-3 bottom-4 h-4 w-4 text-subtle group-hover:text-white" />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </section>
                ))}
            </div>

            <div className="space-y-10 md:space-y-14 mt-4">
                <MovieRow title="Action Blockbusters" movies={action} />
                <MovieRow title="Comedy Hits" movies={comedy} />
                <MovieRow title="Drama Series" movies={drama} />
                <MovieRow title="Animation Favorites" movies={animation} />
            </div>

            {/* SEO Rich Text Content Section */}
            <div className="page-gutter mt-20 md:mt-28 border-t border-line pt-14 pb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start text-gray-400">
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-white tracking-tight">
                            Explore the Universe of Genres
                        </h2>
                        <p className="leading-relaxed">
                            Genres are the roadmap of cinema, guiding us through different worlds, emotions, and experiences. 
                            At GedaTv, we've organized our vast library into intuitive categories, making it easier than ever to find the exact type of story you're in the mood for. 
                            From the high-octane thrills of Action to the thought-provoking depth of Documentaries, our genre sections are your gateway to discovery.
                        </p>
                        <p className="leading-relaxed">
                            Our classification covers both feature films and TV series, ensuring that whether you're looking for a quick movie night or a multi-season binge, you can find the right content within your favorite genres. 
                            Explore categories like Sci-Fi, Horror, Mystery, and Family to discover hidden gems and trending masterpieces.
                        </p>
                    </div>
                    
                    <div className="surface p-6 md:p-8 space-y-6">
                        <h3 className="text-lg font-bold text-white mb-4">Genre Highlights</h3>
                        <div className="space-y-4 text-sm leading-relaxed">
                            <p>
                                <strong className="text-white">Action & Adventure:</strong> Fast-paced storytelling, heroic journeys, and breathtaking stunts that keep you on the edge of your seat.
                            </p>
                            <p>
                                <strong className="text-white">Comedy:</strong> From witty satire to slapstick humor, find the shows and movies that bring laughter to your day.
                            </p>
                            <p>
                                <strong className="text-white">Science Fiction:</strong> Explore futuristic worlds, advanced technology, and the boundless possibilities of the human imagination.
                            </p>
                            <p>
                                <strong className="text-white">Documentary:</strong> Deep dives into real-world stories, history, science, and the fascinating lives of people around the globe.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
