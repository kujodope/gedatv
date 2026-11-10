import Hero from "@/components/Hero";
import { jsonLdScript } from "@/lib/utils";
import MovieRow from "@/components/MovieRow";
import { tmdb } from "@/lib/tmdb";
import CatalogUnavailable from "@/components/CatalogUnavailable";
import { catalogMissing } from "@/lib/catalog";
import InfiniteGenres from "@/components/InfiniteGenres";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "TV Shows",
    description: "Watch the top rated TV series and shows online for free. Stream the best TV shows, currently airing series, and all-time favorites on GedaTv.",
    alternates: {
        canonical: "https://gedatv.netlify.app/tv",
    },
};

export const revalidate = 3600;

export default async function TVPage() {
    const [trending, popular, topRated, airingToday, onTheAir, scifi, drama] = await Promise.all([
        tmdb.getTrending("tv"),
        tmdb.getPopular("tv"),
        tmdb.getTopRated("tv"),
        tmdb.getAiringToday(),
        tmdb.getOnTheAir(),
        tmdb.getDiscover("tv", { genreId: "10765" }), // Sci-Fi & Fantasy
        tmdb.getDiscover("tv", { genreId: "18" }),    // Drama
    ]);

    return (
        <main className="min-h-screen pb-16 overflow-x-hidden">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: jsonLdScript({
                        "@context": "https://schema.org",
                        "@type": "ItemList",
                        "itemListElement": trending.slice(0, 10).map((show, index) => ({
                            "@type": "ListItem",
                            "position": index + 1,
                            "item": {
                                "@type": "TVSeries",
                                "name": show.title || show.name,
                                "url": `https://gedatv.netlify.app/watch/tv/${show.id}`,
                                "image": `https://image.tmdb.org/t/p/w500${show.poster_path}`,
                                "datePublished": show.first_air_date
                            }
                        }))
                    })
                }}
            />
            <h1 className="sr-only">TV Shows | Watch Top Rated TV Series Online Free</h1>
            {catalogMissing(trending)
                ? <CatalogUnavailable />
                : <Hero movies={trending} label="Trending series today" renderedAt={new Date().getTime()} />}

            <div className="relative z-10">
                <div className="pt-6 md:-mt-8 lg:-mt-12 space-y-10 md:space-y-14">
                    <MovieRow title="Airing Today" movies={airingToday} />
                    <MovieRow title="Currently Airing (On The Air)" movies={onTheAir} />
                    <MovieRow title="Trending TV Shows" movies={trending} />
                    <MovieRow title="Popular Series" movies={popular} />
                    <MovieRow title="Top Rated" movies={topRated} />
                    <MovieRow title="Sci-Fi & Fantasy" movies={scifi} />
                    <MovieRow title="Drama Series" movies={drama} />
                    <InfiniteGenres type="tv" />
                </div>
            </div>

            {/* SEO Rich Text Content Section */}
            <div className="page-gutter mt-20 md:mt-28 border-t border-line pt-14 pb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
                    <div className="space-y-6">
                        <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                            Binge-Worthy TV Series & Shows
                        </h2>
                        <p className="text-gray-400 leading-relaxed">
                            Experience the best of television with GedaTv's comprehensive library of TV shows and series. 
                            From critically acclaimed dramas and hilarious sitcoms to captivating sci-fi and reality TV, we bring the best of the small screen directly to your devices. 
                            Our platform ensures you never miss an episode of your favorite series, with updates on currently airing shows and a deep archive of completed classics.
                        </p>
                        <p className="text-gray-400 leading-relaxed">
                            Explore popular series, top-rated shows, and what's airing today. 
                            With GedaTv, you can track your progress, discover new shows based on your interests, and enjoy a premium streaming experience tailored for TV enthusiasts.
                        </p>
                    </div>

                    <div className="surface p-6 md:p-8 space-y-8">
                        <h3 className="text-xl font-bold text-white border-b border-white/10 pb-4">
                            TV Streaming Features
                        </h3>
                        <div className="space-y-6">
                            <div>
                                <h4 className="text-white font-semibold mb-2">Episode Discovery</h4>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    Easily navigate through seasons and episodes with our clean, user-friendly interface.
                                </p>
                            </div>
                            <div>
                                <h4 className="text-white font-semibold mb-2">Real-Time Updates</h4>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    Stay up to date with "Airing Today" and "On The Air" sections that refresh automatically.
                                </p>
                            </div>
                            <div>
                                <h4 className="text-white font-semibold mb-2">Personalized Experience</h4>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    Create your own watchlist and keep track of the series you're currently binge-watching.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
