// JSON responses for the read-only /api routes the browser calls.
//
// These replace server actions for reads: actions are POST requests that
// Next.js runs one at a time per tab and that no cache can store. A GET with
// cache headers runs in parallel, is answered by Netlify's CDN for every
// visitor after the first, and is reused by the browser's own HTTP cache.

type CacheOptions = {
    // Seconds Netlify's CDN serves the answer before refreshing it in the background
    cdn: number;
    // Seconds the visitor's browser reuses it without asking again
    browser?: number;
    // Query params that change the answer. Netlify then ignores any others
    // (cache busters, tracking params) when matching cached copies.
    varyOn: string[];
};

export function cachedJson(data: unknown, { cdn, browser = 300, varyOn }: CacheOptions) {
    return Response.json(data, {
        headers: {
            "Cache-Control": `public, max-age=${browser}`,
            // Only Netlify's CDN reads this one; `durable` shares the cached
            // copy across all CDN locations instead of each edge asking again
            "Netlify-CDN-Cache-Control": `public, durable, s-maxage=${cdn}, stale-while-revalidate=${cdn * 7}`,
            "Netlify-Vary": `query=${varyOn.join("|")}`,
        },
    });
}

// Errors, outages and empty answers are never stored anywhere, so a TMDB
// hiccup can't stick around after TMDB recovers
export function uncachedJson(data: unknown, status = 200) {
    return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

export function badRequest(message: string) {
    return uncachedJson({ error: message }, 400);
}

// Strict parsers for query params that end up in TMDB paths
export const parseId = (value: string | null) => (value && /^\d{1,10}$/.test(value) ? value : null);
export const parseMediaType = (value: string | null) => (value === "movie" || value === "tv" ? value : null);
export function parseIntInRange(value: string | null, min: number, max: number, fallback: number) {
    if (value === null || value === "") return fallback;
    if (!/^\d{1,4}$/.test(value)) return null;
    const n = Number(value);
    return n >= min && n <= max ? n : null;
}
