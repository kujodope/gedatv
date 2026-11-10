// Shared by the browser and the /api/search route (no server-only imports).
// "Dune ", "dune" and "DUNE" are the same TMDB search, so they share one
// cache entry in the browser, on the CDN and on the server.
export const MAX_QUERY_LENGTH = 100;

export function normalizeQuery(q: string | null | undefined) {
    return (q || "").trim().replace(/\s+/g, " ").toLowerCase().slice(0, MAX_QUERY_LENGTH);
}

export const searchApiUrl = (normalized: string) => `/api/search?q=${encodeURIComponent(normalized)}`;
