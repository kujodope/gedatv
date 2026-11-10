const API_KEY = process.env.TMDB_API_KEY || process.env.NEXT_PUBLIC_TMDB_API_KEY || process.env.VITE_TMDB_API;
const BASE_URL = "https://api.themoviedb.org/3";

// Client components import TMDB_CONFIG from ./tmdbConfig directly so the
// fetch/caching code below stays out of the browser bundles
export { TMDB_CONFIG } from "./tmdbConfig";

const NOT_FOUND = { __notFound: true } as const;

// True when TMDB answered 404 for a details request
export const isNotFound = (data: unknown) =>
    !!data && typeof data === "object" && "__notFound" in data;

// False when no TMDB key is configured (local setups without .env): pages
// then show the "catalogue unavailable" notice instead of failing
export const tmdbConfigured = !!API_KEY && API_KEY !== "your_tmdb_api_key_here";

// How long a TMDB answer stays fresh, by how quickly that kind of data changes.
// Used for both the in-memory cache and Next's data cache (`revalidate`), so an
// hourly page rebuild reuses slow-changing answers instead of asking TMDB again.
export const TTL = {
    live: 60 * 60,            // trending, popular, now playing, search: 1 hour
    details: 60 * 60 * 6,     // titles, seasons, people, studios, trailers: 6 hours
    static: 60 * 60 * 24 * 7, // genre lists and title logos: 1 week
} as const;

// In-memory cache for high-frequency server-side TMDB requests
const tmdbMemoryCache = new Map<string, { expires: number; data: any }>();
const inFlightRequests = new Map<string, Promise<any>>();
// A warm server instance can see thousands of distinct URLs; keep memory bounded
const CACHE_MAX_ENTRIES = 1000;

async function fetchTMDB(endpoint: string, params: Record<string, string> = {}, ttl: number = TTL.live) {
    if (!tmdbConfigured) {
        return null;
    }

    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    // Route params end up in the path; never let them add a query, fragment or ".."
    if (!/^(\/[\w-]+)+$/.test(cleanEndpoint)) return null;
    const url = new URL(`${BASE_URL}${cleanEndpoint}`);
    url.searchParams.append("api_key", API_KEY!);
    Object.entries(params).forEach(([key, value]) => url.searchParams.append(key, value));

    const cacheKey = url.toString();

    // Check memory cache. An expired entry is kept: if TMDB fails while we
    // refresh it, the last good answer is served instead of an empty row.
    const cached = tmdbMemoryCache.get(cacheKey);
    if (cached && Date.now() < cached.expires) {
        return cached.data;
    }
    const staleData = cached?.data ?? null;

    // Deduplicate in-flight requests
    if (inFlightRequests.has(cacheKey)) {
        return inFlightRequests.get(cacheKey);
    }

    const requestPromise = (async () => {
        // Two attempts of at most 7s keep a slow TMDB inside the serverless
        // function's time limit instead of turning into a gateway timeout
        const MAX_RETRIES = 2;
        let attempt = 0;

        while (attempt < MAX_RETRIES) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 7000);

                const res = await fetch(cacheKey, {
                    next: { revalidate: ttl },
                    headers: {
                        "Accept": "application/json",
                        "User-Agent": "GedaTvApp/2.0"
                    },
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                if (!res.ok) {
                    if (res.status === 429) { // Rate limit
                        await new Promise(resolve => setTimeout(resolve, 1500 * (attempt + 1)));
                        throw new Error(`Rate limited: ${res.status}`);
                    }
                    if (res.status === 404) {
                        return NOT_FOUND;
                    }
                    return staleData;
                }

                const data = await res.json();
                // Re-insert so the Map's insertion order tracks recency
                tmdbMemoryCache.delete(cacheKey);
                if (tmdbMemoryCache.size >= CACHE_MAX_ENTRIES) {
                    // Maps iterate in insertion order: drop the oldest entry
                    tmdbMemoryCache.delete(tmdbMemoryCache.keys().next().value!);
                }
                tmdbMemoryCache.set(cacheKey, { expires: Date.now() + ttl * 1000, data });
                return data;
            } catch {
                attempt++;
                if (attempt >= MAX_RETRIES) {
                    return staleData;
                }
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
        }
        return staleData;
    })().finally(() => {
        inFlightRequests.delete(cacheKey);
    });

    inFlightRequests.set(cacheKey, requestPromise);
    return requestPromise;
}

export type Movie = {
    id: number;
    title?: string;
    name?: string;
    overview?: string;
    poster_path?: string;
    backdrop_path?: string;
    release_date?: string;
    first_air_date?: string;
    vote_average?: number;
    media_type: "movie" | "tv" | "person" | "company";
    season?: number;
    episode?: number;
    tagline?: string;
    logos?: any[];
    profile_path?: string;
    known_for_department?: string;
    known_for?: Movie[];
    popularity?: number;
    logo_path?: string;
    origin_country?: string;
};

type MediaType = Movie["media_type"];

// List endpoints return ~20 fields per title; cards, rows and grids only read
// these. Dropping the rest keeps the RSC payload that ships with every page small.
export function toListItem(item: any, fallbackType?: MediaType): Movie {
    const media_type: MediaType = item.media_type || fallbackType || "movie";
    const slim: Movie = {
        id: item.id,
        media_type,
        title: item.title,
        name: item.name,
        overview: item.overview,
        poster_path: item.poster_path,
        backdrop_path: item.backdrop_path,
        release_date: item.release_date,
        first_air_date: item.first_air_date,
        vote_average: item.vote_average,
        popularity: item.popularity,
    };
    if (media_type === "person") {
        slim.profile_path = item.profile_path;
        slim.known_for_department = item.known_for_department;
        slim.known_for = (item.known_for || []).slice(0, 3).map((k: Movie) => ({
            id: k.id, media_type: k.media_type, title: k.title, name: k.name, release_date: k.release_date,
        }));
    }
    if (media_type === "company") {
        slim.logo_path = item.logo_path;
        slim.origin_country = item.origin_country;
    }
    return slim;
}

const pick = <T extends object>(obj: T | undefined, keys: (keyof T)[]) =>
    obj ? Object.fromEntries(keys.filter((k) => obj[k] !== undefined).map((k) => [k, obj[k]])) : obj;

export function slimDetailsForClient(d: any) {
    if (!d?.id) return d;
    const type: MediaType = d.title !== undefined ? "movie" : "tv";
    const crewJobs = ["Director", "Writer", "Screenplay", "Author", "Teleplay"];
    return {
        ...d,
        credits: d.credits && {
            cast: (d.credits.cast || []).map((c: any) => pick(c, ["id", "name", "character", "profile_path"])),
            crew: (d.credits.crew || [])
                .filter((c: any) => crewJobs.includes(c.job))
                .map((c: any) => pick(c, ["id", "name", "job", "profile_path"])),
        },
        images: d.images && {
            backdrops: (d.images.backdrops || []).map((i: any) => pick(i, ["file_path"])),
            posters: (d.images.posters || []).slice(0, 18).map((i: any) => pick(i, ["file_path"])),
            logos: (d.images.logos || []).map((i: any) => pick(i, ["file_path", "iso_639_1"])),
        },
        videos: d.videos && {
            results: (d.videos.results || []).map((v: any) => pick(v, ["id", "key", "name", "type", "site"])),
        },
        recommendations: d.recommendations && {
            results: (d.recommendations.results || []).slice(0, 10).map((r: any) => toListItem(r, type)),
        },
        similar: d.similar && {
            results: (d.similar.results || []).slice(0, 10).map((r: any) => toListItem(r, type)),
        },
        release_dates: d.release_dates && {
            results: (d.release_dates.results || []).filter((r: any) => r.iso_3166_1 === "US"),
        },
        content_ratings: d.content_ratings && {
            results: (d.content_ratings.results || []).filter((r: any) => r.iso_3166_1 === "US"),
        },
    };
}

// Curated list of heartwarming romantic & comfort masterpieces for "Comfort Picks"
const SANUS_PICKS_IDS: { type: "movie" | "tv"; id: number }[] = [
    { type: "movie", id: 372058 }, // Your Name
    { type: "movie", id: 313369 }, // La La Land
    { type: "movie", id: 129 },    // Spirited Away
    { type: "movie", id: 122906 }, // About Time
    { type: "movie", id: 4935 },   // Howl's Moving Castle
    { type: "movie", id: 378064 }, // A Silent Voice
    { type: "movie", id: 4348 },   // Pride & Prejudice
    { type: "movie", id: 194 },    // Amélie
    { type: "movie", id: 666277 }, // Past Lives
    { type: "movie", id: 76 },     // Before Sunrise
    { type: "movie", id: 331482 }, // Little Women
    { type: "movie", id: 568160 }, // Weathering With You
    { type: "movie", id: 11036 },  // The Notebook
];

let cachedSanusPicks: { timestamp: number; data: Movie[] } | null = null;

export const tmdb = {
    getTrending: async (type: "movie" | "tv" | "all" = "all"): Promise<Movie[]> => {
        const data = await fetchTMDB(`/trending/${type}/day`);
        return (data?.results || []).map((item: any) => toListItem(item, type === "all" ? undefined : type));
    },
    getTrendingToday: async (type: "movie" | "tv" | "all" = "all"): Promise<Movie[]> => {
        const data = await fetchTMDB(`/trending/${type}/day`);
        return (data?.results || []).map((item: any) => toListItem(item, type === "all" ? undefined : type));
    },
    getTrendingWeek: async (type: "movie" | "tv" | "all" = "all"): Promise<Movie[]> => {
        const data = await fetchTMDB(`/trending/${type}/week`);
        return (data?.results || []).map((item: any) => toListItem(item, type === "all" ? undefined : type));
    },
    getTopRated: async (type: "movie" | "tv"): Promise<Movie[]> => {
        const data = await fetchTMDB(`/${type}/top_rated`);
        return (data?.results || []).map((item: any) => toListItem(item, type));
    },
    getPopular: async (type: "movie" | "tv"): Promise<Movie[]> => {
        const data = await fetchTMDB(`/${type}/popular`);
        return (data?.results || []).map((item: any) => toListItem(item, type));
    },
    getDetails: async (type: "movie" | "tv", id: string) => {
        const data = await fetchTMDB(`/${type}/${id}`, {
            append_to_response: "videos,credits,recommendations,similar,release_dates,content_ratings,images,keywords,external_ids",
            include_image_language: "en,null"
        }, TTL.details);
        return data || {};
    },
    // Throws when TMDB can't be reached, so callers can tell "no matches"
    // apart from an outage (and never cache the outage as an empty result)
    search: async (query: string): Promise<Movie[]> => {
        const [multiData, companyData] = await Promise.all([
            fetchTMDB("/search/multi", { query }),
            fetchTMDB("/search/company", { query })
        ]);
        if (!multiData) throw new Error("TMDB search failed");

        const multiResults = (multiData?.results || [])
            .filter((item: any) =>
                item.media_type === "movie" ||
                item.media_type === "tv" ||
                item.media_type === "person"
            )
            .map((item: any) => toListItem(item));

        const companyResults = (companyData?.results || [])
            .map((item: any) => toListItem({ ...item, media_type: "company" }));

        return [...multiResults, ...companyResults];
    },
    getGenreList: async (type: "movie" | "tv") => {
        const data = await fetchTMDB(`/genre/${type}/list`, {}, TTL.static);
        return data?.genres || [];
    },
    getDiscover: async (type: "movie" | "tv", options: { genreId?: string, year?: string, sortBy?: string, withOriginalLanguage?: string } = {}): Promise<Movie[]> => {
        const params: Record<string, string> = {
            sort_by: options.sortBy || "popularity.desc",
            include_adult: "false",
            "vote_count.gte": "100"
        };
        if (options.genreId) params.with_genres = options.genreId;
        if (options.withOriginalLanguage) params.with_original_language = options.withOriginalLanguage;
        if (options.year) {
            const key = type === "movie" ? "primary_release_year" : "first_air_date_year";
            params[key] = options.year;
        }

        const data = await fetchTMDB(`/discover/${type}`, params);
        return (data?.results || []).map((item: any) => toListItem(item, type));
    },
    // Dedicated Anime discovery: Japanese animation (genre 16 + original language ja)
    getAnime: async (page = 1): Promise<Movie[]> => {
        const [movies, tv] = await Promise.all([
            fetchTMDB("/discover/movie", {
                with_genres: "16",
                with_original_language: "ja",
                sort_by: "popularity.desc",
                "vote_count.gte": "80",
                page: String(page)
            }),
            fetchTMDB("/discover/tv", {
                with_genres: "16",
                with_original_language: "ja",
                sort_by: "popularity.desc",
                "vote_count.gte": "80",
                page: String(page)
            })
        ]);

        const movieItems = (movies?.results || []).map((m: any) => toListItem(m, "movie"));
        const tvItems = (tv?.results || []).map((t: any) => toListItem(t, "tv"));

        // Interleave movies and tv shows smoothly
        const combined: Movie[] = [];
        const maxLen = Math.max(movieItems.length, tvItems.length);
        for (let i = 0; i < maxLen; i++) {
            if (movieItems[i]) combined.push(movieItems[i]);
            if (tvItems[i]) combined.push(tvItems[i]);
        }
        return combined;
    },
    // Dedicated romantic masterpieces for "Comfort Picks"
    getSanusPicks: async (): Promise<Movie[]> => {
        if (cachedSanusPicks && Date.now() - cachedSanusPicks.timestamp < 1000 * 60 * 60) {
            return cachedSanusPicks.data;
        }

        const promises = SANUS_PICKS_IDS.map(async (entry) => {
            const data = await fetchTMDB(`/${entry.type}/${entry.id}`, {}, TTL.details);
            if (data && !isNotFound(data)) {
                return toListItem(data, entry.type);
            }
            return null;
        });

        const results = await Promise.all(promises);
        const filtered = results.filter((item): item is Movie => item !== null);
        // An outage returns nothing; don't remember that for an hour
        if (filtered.length > 0) cachedSanusPicks = { timestamp: Date.now(), data: filtered };
        return filtered;
    },
    getRomance: async (): Promise<Movie[]> => {
        // Genre 10749 = Romance
        const data = await fetchTMDB("/discover/movie", {
            with_genres: "10749",
            sort_by: "vote_average.desc",
            "vote_count.gte": "300"
        });
        return (data?.results || []).map((item: any) => toListItem(item, "movie"));
    },
    // fetchTMDB already caches this for a week; a failed lookup isn't remembered
    getLogo: async (type: "movie" | "tv", id: string): Promise<{ file_path: string; iso_639_1: string | null } | null> => {
        const data = await fetchTMDB(`/${type}/${id}/images`, { include_image_language: "en,null" }, TTL.static);
        const logos: { file_path: string; iso_639_1: string | null }[] = data?.logos || [];
        const best = logos.find((l) => l.iso_639_1 === "en") || logos[0];
        return best ? { file_path: best.file_path, iso_639_1: best.iso_639_1 } : null;
    },
    getSeasonDetails: async (tvId: string, seasonNumber: number) => {
        const data = await fetchTMDB(`/tv/${tvId}/season/${seasonNumber}`, {}, TTL.details);
        return data || {};
    },
    getPersonDetails: async (id: string) => {
        const data = await fetchTMDB(`/person/${id}`, { append_to_response: "external_ids,images" }, TTL.details);
        return data || {};
    },
    getPersonCredits: async (id: string) => {
        const data = await fetchTMDB(`/person/${id}/combined_credits`, {}, TTL.details);
        return data || {};
    },
    getPopularPeople: async (page = 1) => {
        const data = await fetchTMDB("/person/popular", { page: page.toString() });
        return data || {};
    },
    getCollection: async (id: string) => {
        const data = await fetchTMDB(`/collection/${id}`, {}, TTL.details);
        return data || {};
    },
    getListDetails: async (listId: string | number): Promise<Movie[]> => {
        const data = await fetchTMDB(`/list/${listId}`);
        if (!data) return [];

        let allItems = [...(data.items || [])];
        const totalPages = data.total_pages || 1;

        if (totalPages > 1) {
            const promises = [];
            for (let p = 2; p <= totalPages; p++) {
                promises.push(fetchTMDB(`/list/${listId}`, { page: p.toString() }));
            }
            const results = await Promise.all(promises);
            results.forEach((res) => {
                if (res?.items) {
                    allItems = allItems.concat(res.items);
                }
            });
        }

        return allItems.map((item: any) => toListItem(item, "movie"));
    },
    getUpcoming: async (): Promise<Movie[]> => {
        const data = await fetchTMDB("/movie/upcoming");
        return (data?.results || []).map((item: any) => toListItem(item, "movie"));
    },
    getNowPlaying: async (): Promise<Movie[]> => {
        const data = await fetchTMDB("/movie/now_playing");
        return (data?.results || []).map((item: any) => toListItem(item, "movie"));
    },
    getAiringToday: async (): Promise<Movie[]> => {
        const data = await fetchTMDB("/tv/airing_today");
        return (data?.results || []).map((item: any) => toListItem(item, "tv"));
    },
    getOnTheAir: async (): Promise<Movie[]> => {
        const data = await fetchTMDB("/tv/on_the_air");
        return (data?.results || []).map((item: any) => toListItem(item, "tv"));
    },
    getRandomContent: async (): Promise<Movie | null> => {
        const types: ("movie" | "tv")[] = ["movie", "tv"];
        const type = types[Math.floor(Math.random() * types.length)];
        const page = Math.floor(Math.random() * 5) + 1;
        const data = await fetchTMDB(`/${type}/popular`, { page: page.toString() });
        const results = data?.results || [];
        if (results.length === 0) return null;
        const movie = results[Math.floor(Math.random() * results.length)];
        return { ...movie, media_type: type };
    },
    getTrailer: async (type: "movie" | "tv", id: string) => {
        const data = await fetchTMDB(`/${type}/${id}/videos`, {}, TTL.details);
        // Throw on an outage so it isn't cached as "this title has no trailer"
        if (!data) throw new Error("TMDB videos request failed");
        const videos = data?.results || [];
        const trailer = videos.find((v: any) => v.type === "Trailer" && v.site === "YouTube") ||
            videos.find((v: any) => v.type === "Teaser" && v.site === "YouTube") ||
            videos.find((v: any) => v.site === "YouTube");
        return trailer ? `https://www.youtube.com/embed/${trailer.key}?autoplay=1` : null;
    },
    getCompanyDetails: async (id: string) => {
        const data = await fetchTMDB(`/company/${id}`, {}, TTL.details);
        return data || null;
    },
    getNetworkDetails: async (id: string) => {
        const data = await fetchTMDB(`/network/${id}`, {}, TTL.details);
        return data || null;
    },
    getDiscoverByCompany: async (companyId: string, type: "movie" | "tv" = "movie", page: number = 1): Promise<{ results: Movie[]; totalPages: number; totalResults: number }> => {
        const data = await fetchTMDB(`/discover/${type}`, {
            with_companies: companyId,
            sort_by: "popularity.desc",
            include_adult: "false",
            page: page.toString()
        });
        const results = (data?.results || []).map((item: any) => toListItem(item, type));
        return {
            results,
            totalPages: data?.total_pages || 1,
            totalResults: data?.total_results || 0
        };
    },
    getDiscoverByNetwork: async (networkId: string, page: number = 1): Promise<{ results: Movie[]; totalPages: number; totalResults: number }> => {
        const data = await fetchTMDB(`/discover/tv`, {
            with_networks: networkId,
            sort_by: "popularity.desc",
            include_adult: "false",
            page: page.toString()
        });
        const results = (data?.results || []).map((item: any) => toListItem(item, "tv"));
        return {
            results,
            totalPages: data?.total_pages || 1,
            totalResults: data?.total_results || 0
        };
    }
};
