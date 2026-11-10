import { Suspense, type ComponentProps } from "react";
import { preload } from "react-dom";
import Hero from "@/components/Hero";
import MovieRow from "@/components/MovieRow";
import { tmdb, type Movie } from "@/lib/tmdb";
import { catalogMissing } from "@/lib/catalog";
import CatalogUnavailable from "@/components/CatalogUnavailable";
import RecentlyPlayedRow from "@/components/RecentlyPlayedRow";
import CoupleRows from "@/components/CoupleRows";
import InfiniteGenres from "@/components/InfiniteGenres";
import Top10Row from "@/components/Top10Row";
import { MovieRowSkeleton } from "@/components/Skeleton";
import { heroSrcSet, tmdbImage } from "@/lib/images";
import { Metadata } from "next";
import { Sparkles, Flame, Film, Tv, Star, Calendar } from "lucide-react";

export const metadata: Metadata = {
  title: {
    absolute: "GedaTv",
  },
  description: "Unlimited movies, anime, and TV shows. A cozy digital sanctuary made with love for watching together.",
  alternates: {
    canonical: "https://gedatv.netlify.app",
  },
};

export const revalidate = 3600;

// Title logos for the first hero slides, fetched as soon as the trending list
// arrives (alongside the other rows, not after all of them)
async function withHeroLogos(trending: Promise<Movie[]>): Promise<Movie[]> {
  const movies = await trending;
  return Promise.all(
    movies.slice(0, 8).map(async (m, idx) => {
      if (idx >= 4) return { ...m, logos: [] };
      const logo = await tmdb.getLogo(m.media_type === "tv" ? "tv" : "movie", m.id.toString());
      return { ...m, logos: logo ? [logo] : [] };
    }),
  );
}

type RowProps = Omit<ComponentProps<typeof MovieRow>, "movies">;

// A below-the-fold row that renders as soon as its own list arrives
async function AsyncRow({ movies, ...props }: RowProps & { movies: Promise<Movie[]> }) {
  const list = await movies;
  return list.length > 0 ? <MovieRow {...props} movies={list} /> : null;
}

// Rows reserve their height while loading so the page doesn't jump
const RowFallback = <MovieRowSkeleton />;

export default async function Home() {
  // Every TMDB request starts here, at the same time
  const trendingTodayRequest = tmdb.getTrendingToday("all");
  const heroRequest = withHeroLogos(trendingTodayRequest);
  const sanusPicksRequest = tmdb.getSanusPicks();
  const animeHits = tmdb.getAnime(1);
  const trendingWeek = tmdb.getTrendingWeek("all");
  const popularMovies = tmdb.getPopular("movie");
  const popularTV = tmdb.getPopular("tv");
  const topRated = tmdb.getTopRated("movie");
  const upcoming = tmdb.getUpcoming();

  // Only what is on screen first (the hero and the rows right under it) is
  // waited for, so the cached page has them in place at the top of the HTML.
  // Everything further down streams in as its own list arrives, without
  // holding up the page.
  const [heroMovies, sanusPicks, trendingToday] = await Promise.all([
    heroRequest,
    sanusPicksRequest,
    trendingTodayRequest,
  ]);

  // Ask for the first slide's artwork from <head>, before the browser reaches the <img>
  const first = heroMovies.find((m) => m.backdrop_path);
  if (first?.backdrop_path) {
    preload(tmdbImage("w1280", first.backdrop_path)!, {
      as: "image",
      imageSrcSet: heroSrcSet(first.backdrop_path),
      imageSizes: "100vw",
      fetchPriority: "high",
    });
  }

  return (
    <main className="min-h-screen pb-20 overflow-x-hidden">
      <h1 className="sr-only">GedaTv | Watch Movies, TV Shows & Anime Online</h1>

      {catalogMissing(heroMovies)
        ? <CatalogUnavailable />
        : <Hero movies={heroMovies} label="#1 Trending Today" renderedAt={new Date().getTime()} />}

      <div className="relative z-10 space-y-10 md:space-y-14 pt-6 md:-mt-8 lg:-mt-12">
        {/* Real Continue Watching */}
        <RecentlyPlayedRow />

        {/* Real Couple Space: Our Watchlist & Our Favourite Movies */}
        <CoupleRows />

        {/* Comfort Picks: Heartwarming romantic & comfort movies */}
        {sanusPicks.length > 0 && (
          <MovieRow
            title="Comfort Picks"
            subtitle="Heartwarming comfort stories and romantic classics to watch together"
            movies={sanusPicks}
            icon={<Sparkles className="w-5 h-5 text-accent" />}
            badge="For Us"
          />
        )}

        {/* Top 10 Ranked Row */}
        <Top10Row title="Top 10 Today" movies={trendingToday} />

        {/* Trending Today */}
        <MovieRow
          title="Trending Today"
          subtitle="What people are loving right now"
          movies={trendingToday}
          icon={<Flame className="w-5 h-5 text-love" />}
        />

        {/* Below the fold: streamed in one piece, so it never delays the rows above */}
        <Suspense fallback={RowFallback}>
          <div className="space-y-10 md:space-y-14">
            {/* Anime Hits */}
            <AsyncRow
              title="Anime"
              subtitle="Beloved animated masterworks and captivating series from Japan"
              movies={animeHits}
              seeAllUrl="/anime"
              icon={<Sparkles className="w-5 h-5 text-lavender" />}
              badge="Anime"
            />

            {/* Trending This Week */}
            <AsyncRow
              title="Trending This Week"
              subtitle="The week's most talked about releases"
              movies={trendingWeek}
            />

            {/* Popular Movies */}
            <AsyncRow
              title="Popular Movies"
              movies={popularMovies}
              seeAllUrl="/movies"
              icon={<Film className="w-5 h-5 text-accent" />}
            />

            {/* Popular TV Shows */}
            <AsyncRow
              title="Popular TV Shows"
              movies={popularTV}
              seeAllUrl="/tv"
              icon={<Tv className="w-5 h-5 text-pink" />}
            />

            {/* Top Rated */}
            <AsyncRow
              title="Top Rated"
              subtitle="Critically acclaimed cinema classics"
              movies={topRated}
              icon={<Star className="w-5 h-5 text-gold" />}
            />

            {/* Upcoming Releases */}
            <AsyncRow
              title="Upcoming Releases"
              subtitle="Exciting premieres heading to screens soon"
              movies={upcoming}
              icon={<Calendar className="w-5 h-5 text-muted" />}
            />
          </div>
        </Suspense>

        {/* Infinite Genre discovery */}
        <InfiniteGenres />
      </div>
    </main>
  );
}
