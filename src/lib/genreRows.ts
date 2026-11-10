import { tmdb, type Movie } from "@/lib/tmdb";

export type GenreRowType = "all" | "movie" | "tv";
type GenreDef = { title: string; type: "movie" | "tv"; genreId: string };

// Genre rows that load as the home, Movies and TV pages are scrolled
export const GENRE_ROWS: Record<GenreRowType, GenreDef[]> = {
    all: [
        { title: "Sci-Fi & Fantasy", type: "tv", genreId: "10765" },
        { title: "Adventure Quests", type: "movie", genreId: "12" },
        { title: "Gripping Dramas", type: "movie", genreId: "18" },
        { title: "Chilling Horror", type: "movie", genreId: "27" },
        { title: "Crime Thrillers", type: "movie", genreId: "80" },
        { title: "Animated Wonders", type: "movie", genreId: "16" },
        { title: "Mystery & Suspense", type: "movie", genreId: "9648" },
        { title: "Romantic Getaways", type: "movie", genreId: "10749" },
        { title: "Reality Obsessions", type: "tv", genreId: "10764" },
        { title: "Insightful Documentaries", type: "movie", genreId: "99" },
        { title: "Wild West Tales", type: "movie", genreId: "37" },
        { title: "Musical Journeys", type: "movie", genreId: "10402" },
        { title: "Historic Wars", type: "movie", genreId: "36" },
    ],
    movie: [
        { title: "Sci-Fi & Fantasy", type: "movie", genreId: "878" },
        { title: "Adventure Quests", type: "movie", genreId: "12" },
        { title: "Animated Wonders", type: "movie", genreId: "16" },
        { title: "Comedy Hits", type: "movie", genreId: "35" },
        { title: "Crime Thrillers", type: "movie", genreId: "80" },
        { title: "Insightful Documentaries", type: "movie", genreId: "99" },
        { title: "Romantic Getaways", type: "movie", genreId: "10749" },
        { title: "Mystery & Suspense", type: "movie", genreId: "9648" },
        { title: "Historic Wars", type: "movie", genreId: "36" },
        { title: "Wild West Tales", type: "movie", genreId: "37" },
        { title: "Musical Journeys", type: "movie", genreId: "10402" },
    ],
    tv: [
        { title: "Action & Adventure", type: "tv", genreId: "10759" },
        { title: "Animated Wonders", type: "tv", genreId: "16" },
        { title: "Comedy Hits", type: "tv", genreId: "35" },
        { title: "Crime Thrillers", type: "tv", genreId: "80" },
        { title: "Mystery & Suspense", type: "tv", genreId: "9648" },
        { title: "Reality Obsessions", type: "tv", genreId: "10764" },
        { title: "Insightful Documentaries", type: "tv", genreId: "99" },
        { title: "Historic Wars", type: "tv", genreId: "10768" },
        { title: "Wild West Tales", type: "tv", genreId: "37" },
        { title: "Musical Journeys", type: "tv", genreId: "10402" },
    ],
};

export type GenreRow = { title: string; movies: Movie[] };

// All genres of the batch are requested from TMDB at the same time
export async function getGenreRows(type: GenreRowType, start: number, limit: number): Promise<GenreRow[]> {
    const slice = GENRE_ROWS[type].slice(start, start + limit);
    const rows = await Promise.all(
        slice.map(async (g) => ({ title: g.title, movies: await tmdb.getDiscover(g.type, { genreId: g.genreId }) })),
    );
    return rows.filter((r) => r.movies.length > 0);
}
