"use client";

const RECENTLY_PLAYED_KEY = "gedatv_recently_played";
const WATCHLIST_KEY = "gedatv_watchlist";
const MAX_RECENT = 20;

export interface RecentItem {
    id: string;
    type: "movie" | "tv";
    title: string;
    overview?: string;
    poster_path: string;
    backdrop_path?: string;
    vote_average?: number;
    release_date?: string;
    first_air_date?: string;
    last_played: number;
    season?: number;
    episode?: number;
    tagline?: string;
}

// Shape written by the previous (Vite) version of GedaTv under the same
// "gedatv_watchlist" key: { ids: string[], items: LegacyItem[] }
interface LegacyItem {
    id?: string | number;
    mediaId?: string | number;
    type?: string;
    title?: string;
    poster_path?: string | null;
    vote_average?: number;
    release_date?: string | null;
    addedAt?: string;
}

function isValidItem(item: unknown): item is RecentItem {
    if (!item || typeof item !== "object") return false;
    const { id, type } = item as RecentItem;
    return (typeof id === "string" || typeof id === "number") && (type === "movie" || type === "tv");
}

function fromLegacy(item: LegacyItem): RecentItem {
    const type = item?.type === "tv" ? "tv" : "movie";
    return {
        id: String(item?.id ?? item?.mediaId ?? ""),
        type,
        title: item?.title || "",
        poster_path: item?.poster_path || "",
        vote_average: item?.vote_average,
        release_date: type === "movie" ? item?.release_date || undefined : undefined,
        first_air_date: type === "tv" ? item?.release_date || undefined : undefined,
        last_played: Date.parse(item?.addedAt || "") || Date.now(),
    };
}

// Reads a stored list, tolerating corrupt data and the old site's format so a
// bad entry in localStorage can never crash the page.
function readList(key: string): RecentItem[] {
    const stored = localStorage.getItem(key);
    if (!stored) return [];

    let parsed: unknown;
    try {
        parsed = JSON.parse(stored);
    } catch {
        return [];
    }

    if (Array.isArray(parsed)) {
        return parsed.filter(isValidItem).map(i => ({ ...i, id: String(i.id) }));
    }

    const legacyItems = (parsed as { items?: unknown } | null)?.items;
    if (Array.isArray(legacyItems)) {
        const migrated = legacyItems.map(i => fromLegacy(i as LegacyItem)).filter(i => i.id !== "");
        localStorage.setItem(key, JSON.stringify(migrated));
        return migrated;
    }

    return [];
}

// In-memory caches to bypass redundant localStorage reads and JSON.parse operations
let cachedWatchlist: RecentItem[] | null = null;
let cachedWatchlistSet: Set<string> | null = null;
let cachedRecentlyPlayed: RecentItem[] | null = null;

// Multi-tab or custom event invalidation listeners
if (typeof window !== "undefined") {
    window.addEventListener("watchlistUpdated", () => {
        cachedWatchlist = null;
        cachedWatchlistSet = null;
    });
    window.addEventListener("recentlyPlayedUpdated", () => {
        cachedRecentlyPlayed = null;
    });
    // Another tab wrote one of the lists: drop the stale copies and let this
    // tab's listeners re-read
    window.addEventListener("storage", (e) => {
        if (e.key === null || e.key === WATCHLIST_KEY) {
            cachedWatchlist = null;
            cachedWatchlistSet = null;
            window.dispatchEvent(new Event("watchlistUpdated"));
        }
        if (e.key === null || e.key === RECENTLY_PLAYED_KEY) {
            cachedRecentlyPlayed = null;
            window.dispatchEvent(new Event("recentlyPlayedUpdated"));
        }
    });
}

export function saveToRecentlyPlayed(item: RecentItem) {
    if (typeof window === "undefined") return;

    try {
        let items = readList(RECENTLY_PLAYED_KEY);

        // Remove existing entry for the same item (to move it to top)
        items = items.filter(i => !(i.id === item.id && i.type === item.type));

        // Add new item to the beginning
        items.unshift({ ...item, last_played: Date.now() });

        // Limit the number of items
        if (items.length > MAX_RECENT) {
            items = items.slice(0, MAX_RECENT);
        }

        localStorage.setItem(RECENTLY_PLAYED_KEY, JSON.stringify(items));
        cachedRecentlyPlayed = items;
        
        // Dispatch a custom event to notify other components
        window.dispatchEvent(new Event("recentlyPlayedUpdated"));
    } catch {
        // Silently fail
    }
}

export function getRecentlyPlayed(): RecentItem[] {
    if (typeof window === "undefined") return [];
    if (cachedRecentlyPlayed !== null) return cachedRecentlyPlayed;

    try {
        cachedRecentlyPlayed = readList(RECENTLY_PLAYED_KEY);
        return cachedRecentlyPlayed;
    } catch {
        return [];
    }
}

export function removeFromRecentlyPlayed(id: string, type?: string) {
    if (typeof window === "undefined") return;

    try {
        const targetId = String(id).trim();
        const normType = type === "series" ? "tv" : type;

        let items = readList(RECENTLY_PLAYED_KEY);
        items = items.filter(i => {
            const itemNormType = (i.type as string) === "series" ? "tv" : i.type;
            const idMatches = String(i.id).trim() === targetId;
            const typeMatches = !normType || !itemNormType || itemNormType === normType;
            return !(idMatches && typeMatches);
        });

        localStorage.setItem(RECENTLY_PLAYED_KEY, JSON.stringify(items));
        cachedRecentlyPlayed = items;
        window.dispatchEvent(new Event("recentlyPlayedUpdated"));
    } catch {
        // Silently fail
    }
}

// Watchlist Functions
// last_played is stamped here, so callers may omit it
export function addToWatchlist(item: Omit<RecentItem, "last_played"> & { last_played?: number }) {
    if (typeof window === "undefined") return;

    try {
        const items = readList(WATCHLIST_KEY);

        // Check if already in watchlist
        const exists = items.some(i => i.id === item.id && i.type === item.type);
        if (exists) return;

        items.unshift({ ...item, last_played: Date.now() });
        localStorage.setItem(WATCHLIST_KEY, JSON.stringify(items));
        cachedWatchlist = items;
        window.dispatchEvent(new Event("watchlistUpdated"));
    } catch {
        // Silently fail
    }
}

export function removeFromWatchlist(id: string, type: string) {
    if (typeof window === "undefined") return;

    try {
        let items = readList(WATCHLIST_KEY);
        items = items.filter(i => !(i.id === id && i.type === type));

        localStorage.setItem(WATCHLIST_KEY, JSON.stringify(items));
        cachedWatchlist = items;
        window.dispatchEvent(new Event("watchlistUpdated"));
    } catch {
        // Silently fail
    }
}

export function isInWatchlist(id: string, type: string): boolean {
    if (typeof window === "undefined") return false;
    if (!cachedWatchlistSet) {
        const items = getWatchlist();
        cachedWatchlistSet = new Set(items.map(i => `${i.type}:${i.id}`));
    }
    return cachedWatchlistSet.has(`${type}:${id}`);
}

export function getWatchlist(): RecentItem[] {
    if (typeof window === "undefined") return [];
    if (cachedWatchlist !== null) return cachedWatchlist;

    try {
        cachedWatchlist = readList(WATCHLIST_KEY);
        return cachedWatchlist;
    } catch {
        return [];
    }
}
