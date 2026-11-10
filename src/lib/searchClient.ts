// Search results in the browser. Typing starts the request before the
// results page needs it, and answers are kept for the session (also in
// sessionStorage), so going back, retyping or reloading a search is instant.
import type { Movie } from "@/lib/tmdb";
import { getJSON } from "@/lib/api";
import { normalizeQuery, searchApiUrl } from "@/lib/searchQuery";

export { normalizeQuery };

const STORAGE_KEY = "gedatv_search_cache";
const MAX_STORED = 25;

let results: Map<string, Movie[]> | null = null;

function store(): Map<string, Movie[]> {
    if (results) return results;
    results = new Map();
    try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        if (raw) for (const [q, items] of JSON.parse(raw) as [string, Movie[]][]) results.set(q, items);
    } catch {
        // Storage disabled or corrupt: start empty
    }
    return results;
}

function remember(q: string, items: Movie[]) {
    const map = store();
    map.delete(q);
    map.set(q, items);
    while (map.size > MAX_STORED) map.delete(map.keys().next().value!);
    try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...map]));
    } catch {
        // Quota exceeded or storage disabled: the in-memory copy still works
    }
}

// Results already in hand for this query, without waiting
export function peekSearch(query: string): Movie[] | undefined {
    const q = normalizeQuery(query);
    if (!q || typeof window === "undefined") return undefined;
    return store().get(q);
}

export async function searchTitles(query: string): Promise<Movie[]> {
    const q = normalizeQuery(query);
    if (!q) return [];
    const known = peekSearch(q);
    if (known) return known;
    const items = await getJSON<Movie[]>(searchApiUrl(q));
    remember(q, items);
    return items;
}

// Start a search in the background (while someone is still typing)
export function prefetchSearch(query: string) {
    return searchTitles(query).catch(() => undefined);
}
