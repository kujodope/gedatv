"use client";

/*
 * GedaTv personal library
 * -------------------------
 * One versioned localStorage document holds everything personal:
 *   - profiles (two by default: you + your partner), each with its own
 *     watchlist, favourites, watched marks, history and playback progress
 *   - shared couple space: together list, "our favourites", movie-date plans
 *   - custom collections
 *   - settings (theme, accent, density, motion, player preferences)
 *
 * IMPORTANT: this lives in the browser only. It does not sync between devices
 * by itself; the share links and JSON backup in /us and /settings are the
 * honest way to move data between phones/laptops without a backend.
 */

import { useSyncExternalStore } from "react";

export type MediaType = "movie" | "tv";

export interface TitleRef {
    id: string;
    type: MediaType;
    title: string;
    poster_path?: string | null;
    backdrop_path?: string | null;
    vote_average?: number;
    release_date?: string;
    first_air_date?: string;
    overview?: string;
}

export interface SavedItem extends TitleRef {
    addedAt: number;
    addedBy?: string; // profile id
}

export interface TogetherItem extends SavedItem {
    watchedAt?: number;
}

export interface HistoryItem extends TitleRef {
    last_played: number;
    season?: number;
    episode?: number;
    tagline?: string;
    /** 0..1, only set when the player reported real playback position */
    progress?: number;
}

export interface ProgressEntry {
    position: number;
    duration: number;
    updatedAt: number;
}

export interface Profile {
    id: string;
    name: string;
    avatar: string; // emoji
    color: string; // css colour used for the avatar ring
}

export interface ProfileData {
    watchlist: SavedItem[];
    favourites: SavedItem[];
    watched: Record<string, number>; // key -> timestamp
    history: HistoryItem[];
    progress: Record<string, ProgressEntry>; // "tv:123:1:2" / "movie:55"
    recentSearches: string[];
}

export interface Collection {
    id: string;
    name: string;
    description: string;
    emoji: string;
    items: SavedItem[];
    createdAt: number;
    updatedAt: number;
    createdBy?: string;
}

export interface DatePlan {
    id: string;
    item: TitleRef;
    when: string; // ISO local datetime "2026-10-20T20:00"
    note: string;
    createdAt: number;
    createdBy?: string;
}

export interface CoupleSpace {
    together: TogetherItem[];
    ourFavourites: SavedItem[];
    favouritesTitle: string;
    favouritesDescription: string;
    favouritesCover: string; // TMDB backdrop path ("/abc.jpg") or https URL, "" = auto
    plans: DatePlan[];
    since: string; // optional "together since" date (YYYY-MM-DD)
}

export type ThemePref = "dark" | "light" | "system";
export type AccentPref = "pink" | "rose" | "lavender" | "peach";

export interface Settings {
    theme: ThemePref;
    accent: AccentPref;
    density: "comfortable" | "compact";
    reducedMotion: boolean;
    autoplayNext: boolean;
    defaultServer: number;
    region: string; // watch-provider region
    browseSort: string; // default discover sort
}

export interface LibraryState {
    version: 3;
    profiles: Profile[];
    activeProfile: string;
    data: Record<string, ProfileData>;
    collections: Collection[];
    couple: CoupleSpace;
    settings: Settings;
}

const STORAGE_KEY = "gedatv_v3";
// Small mirror read by the inline <head> script to theme before first paint
export const PREFS_KEY = "gedatv_prefs";
const LEGACY_WATCHLIST = "gedatv_watchlist";
const LEGACY_RECENT = "gedatv_recently_played";

const MAX_HISTORY = 40;
const MAX_SEARCHES = 8;

export const keyOf = (type: string, id: string | number) => `${type}:${id}`;
export const progressKey = (type: string, id: string | number, s?: number, e?: number) =>
    type === "tv" && s && e ? `tv:${id}:${s}:${e}` : `${type}:${id}`;

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

const emptyProfileData = (): ProfileData => ({
    watchlist: [],
    favourites: [],
    watched: {},
    history: [],
    progress: {},
    recentSearches: [],
});

export const DEFAULT_SETTINGS: Settings = {
    theme: "dark",
    accent: "pink",
    density: "comfortable",
    reducedMotion: false,
    autoplayNext: true,
    defaultServer: 0,
    region: "GB",
    browseSort: "popularity.desc",
};

const defaultState = (): LibraryState => ({
    version: 3,
    profiles: [
        { id: "p1", name: "You", avatar: "🐻", color: "#c9b8ff" },
        { id: "p2", name: "Sanu", avatar: "🐱", color: "#ff8db3" },
    ],
    activeProfile: "p1",
    data: { p1: emptyProfileData(), p2: emptyProfileData() },
    collections: [],
    couple: {
        together: [],
        ourFavourites: [],
        favouritesTitle: "Our favourite movies",
        favouritesDescription: "The films and shows we keep coming back to.",
        favouritesCover: "",
        plans: [],
        since: "",
    },
    settings: { ...DEFAULT_SETTINGS },
});

// ---------------------------------------------------------------------------
// Validation helpers — localStorage can contain anything, never trust it
// ---------------------------------------------------------------------------

const str = (v: unknown, max = 500) => (typeof v === "string" ? v.slice(0, max) : "");
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : undefined);

export function sanitizeTitle(raw: any): TitleRef | null {
    if (!raw || typeof raw !== "object") return null;
    const id = raw.id ?? raw.mediaId;
    if (typeof id !== "string" && typeof id !== "number") return null;
    const type = raw.type ?? raw.media_type;
    if (type !== "movie" && type !== "tv") return null;
    const sId = String(id);
    if (!/^\d{1,10}$/.test(sId)) return null;
    const path = (p: unknown) => (typeof p === "string" && /^\/[\w.-]+$/.test(p) ? p : undefined);
    return {
        id: sId,
        type,
        title: str(raw.title || raw.name, 200) || "Untitled",
        poster_path: path(raw.poster_path),
        backdrop_path: path(raw.backdrop_path),
        vote_average: num(raw.vote_average),
        release_date: str(raw.release_date, 10) || undefined,
        first_air_date: str(raw.first_air_date, 10) || undefined,
        overview: str(raw.overview, 600) || undefined,
    };
}

function sanitizeSaved<T extends SavedItem>(raw: any): T | null {
    const t = sanitizeTitle(raw);
    if (!t) return null;
    const out: any = { ...t, addedAt: num(raw.addedAt) ?? num(raw.last_played) ?? Date.now() };
    if (typeof raw.addedBy === "string") out.addedBy = raw.addedBy.slice(0, 20);
    if (num(raw.watchedAt)) out.watchedAt = raw.watchedAt;
    return out as T;
}

const list = <T,>(v: unknown, fn: (x: any) => T | null, max = 1000): T[] =>
    Array.isArray(v) ? (v.map(fn).filter(Boolean) as T[]).slice(0, max) : [];

const dedupe = <T extends TitleRef>(items: T[]) => {
    const seen = new Set<string>();
    return items.filter((i) => {
        const k = keyOf(i.type, i.id);
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
    });
};

function sanitizeProfileData(raw: any): ProfileData {
    const d = emptyProfileData();
    if (!raw || typeof raw !== "object") return d;
    d.watchlist = dedupe(list(raw.watchlist, sanitizeSaved));
    d.favourites = dedupe(list(raw.favourites, sanitizeSaved));
    if (raw.watched && typeof raw.watched === "object") {
        for (const [k, v] of Object.entries(raw.watched)) if (/^(movie|tv):\d+$/.test(k) && num(v)) d.watched[k] = v as number;
    }
    d.history = dedupe(
        list(raw.history, (h: any) => {
            const t = sanitizeTitle(h);
            if (!t) return null;
            return {
                ...t,
                last_played: num(h.last_played) ?? Date.now(),
                season: num(h.season),
                episode: num(h.episode),
                tagline: str(h.tagline, 200) || undefined,
                progress: num(h.progress),
            } as HistoryItem;
        }, MAX_HISTORY),
    );
    if (raw.progress && typeof raw.progress === "object") {
        for (const [k, v] of Object.entries<any>(raw.progress)) {
            if (/^(movie:\d+|tv:\d+:\d+:\d+)$/.test(k) && num(v?.position) !== undefined && num(v?.duration)) {
                d.progress[k] = { position: v.position, duration: v.duration, updatedAt: num(v.updatedAt) ?? 0 };
            }
        }
    }
    d.recentSearches = list(raw.recentSearches, (s) => (typeof s === "string" && s.trim() ? s.slice(0, 80) : null), MAX_SEARCHES);
    return d;
}

function sanitizeState(raw: any): LibraryState {
    const base = defaultState();
    if (!raw || typeof raw !== "object") return base;
    const profiles = list<Profile>(raw.profiles, (p: any) =>
        p && typeof p.id === "string" && /^p\d{1,3}$/.test(p.id)
            ? { id: p.id, name: str(p.name, 24) || "Me", avatar: str(p.avatar, 8) || "💗", color: /^#[0-9a-f]{6}$/i.test(p.color) ? p.color : "#ff8db3" }
            : null, 4);
    const state: LibraryState = {
        ...base,
        profiles: profiles.length ? profiles : base.profiles,
    };
    state.activeProfile = state.profiles.some((p) => p.id === raw.activeProfile) ? raw.activeProfile : state.profiles[0].id;
    state.data = {};
    for (const p of state.profiles) state.data[p.id] = sanitizeProfileData(raw.data?.[p.id]);
    state.collections = list<Collection>(raw.collections, (c: any) =>
        c && typeof c.id === "string"
            ? {
                id: c.id.slice(0, 24),
                name: str(c.name, 60) || "Untitled collection",
                description: str(c.description, 300),
                emoji: str(c.emoji, 8) || "🎬",
                items: dedupe(list(c.items, sanitizeSaved)),
                createdAt: num(c.createdAt) ?? Date.now(),
                updatedAt: num(c.updatedAt) ?? Date.now(),
                createdBy: typeof c.createdBy === "string" ? c.createdBy : undefined,
            }
            : null, 100);
    const c = raw.couple || {};
    state.couple = {
        together: dedupe(list<TogetherItem>(c.together, sanitizeSaved)),
        ourFavourites: dedupe(list(c.ourFavourites, sanitizeSaved)),
        favouritesTitle: str(c.favouritesTitle, 60) || base.couple.favouritesTitle,
        favouritesDescription: typeof c.favouritesDescription === "string" ? c.favouritesDescription.slice(0, 300) : base.couple.favouritesDescription,
        favouritesCover: sanitizeCover(c.favouritesCover),
        plans: list<DatePlan>(c.plans, sanitizePlan, 50),
        since: /^\d{4}-\d{2}-\d{2}$/.test(c.since) ? c.since : "",
    };
    const s = raw.settings || {};
    state.settings = {
        theme: ["dark", "light", "system"].includes(s.theme) ? s.theme : base.settings.theme,
        accent: ["pink", "rose", "lavender", "peach"].includes(s.accent) ? s.accent : base.settings.accent,
        density: s.density === "compact" ? "compact" : "comfortable",
        reducedMotion: s.reducedMotion === true,
        autoplayNext: s.autoplayNext !== false,
        defaultServer: Number.isInteger(s.defaultServer) && s.defaultServer >= 0 && s.defaultServer < 50 ? s.defaultServer : 0,
        region: /^[A-Z]{2}$/.test(s.region) ? s.region : base.settings.region,
        browseSort: typeof s.browseSort === "string" && /^[a-z_.]+$/.test(s.browseSort) ? s.browseSort : base.settings.browseSort,
    };
    return state;
}

export function sanitizeCover(v: unknown): string {
    if (typeof v !== "string") return "";
    if (/^\/[\w.-]+$/.test(v)) return v;
    try {
        const u = new URL(v);
        return u.protocol === "https:" ? u.toString().slice(0, 500) : "";
    } catch {
        return "";
    }
}

export function sanitizePlan(p: any): DatePlan | null {
    const item = sanitizeTitle(p?.item);
    if (!item) return null;
    const when = typeof p.when === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(p.when) ? p.when : "";
    if (!when) return null;
    return {
        id: typeof p.id === "string" ? p.id.slice(0, 24) : uid(),
        item,
        when,
        note: str(p.note, 280),
        createdAt: num(p.createdAt) ?? Date.now(),
        createdBy: typeof p.createdBy === "string" ? p.createdBy.slice(0, 24) : undefined,
    };
}

// ---------------------------------------------------------------------------
// Legacy migration (previous Next.js + Vite versions)
// ---------------------------------------------------------------------------

function readLegacy(key: string): any[] {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
        if (Array.isArray(parsed?.items)) return parsed.items;
    } catch { /* ignore corrupt data */ }
    return [];
}

function migrateLegacy(state: LibraryState): LibraryState {
    const wl = readLegacy(LEGACY_WATCHLIST);
    const rp = readLegacy(LEGACY_RECENT);
    if (!wl.length && !rp.length) return state;
    const d = state.data[state.activeProfile];
    d.watchlist = dedupe(list(wl.map((i) => ({ ...i, addedAt: i.last_played ?? Date.parse(i.addedAt || "") })), sanitizeSaved));
    d.history = sanitizeProfileData({ history: rp }).history;
    return state;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

let state: LibraryState | null = null;
const serverState = defaultState();
const listeners = new Set<() => void>();

// Until Oct 2026 the details page could only write the legacy list, and the
// My List page read only that list, so some saved titles exist only there.
// Once per browser, copy any of them the active profile is missing. This only
// ever adds items and leaves the legacy key untouched.
const LEGACY_MERGED_KEY = "gedatv_legacy_watchlist_merged";

function mergeLegacyWatchlist(s: LibraryState): LibraryState {
    try {
        if (localStorage.getItem(LEGACY_MERGED_KEY)) return s;
        const d = s.data[s.activeProfile];
        const legacy = readLegacy(LEGACY_WATCHLIST);
        if (d && legacy.length) {
            const have = new Set(d.watchlist.map((i) => keyOf(i.type, i.id)));
            const missing = list(
                legacy.map((i) => ({ ...i, addedAt: i.last_played ?? Date.parse(i.addedAt || "") })),
                sanitizeSaved
            ).filter((i) => !have.has(keyOf(i.type, i.id)));
            if (missing.length) {
                d.watchlist = dedupe([...d.watchlist, ...missing]).sort((a, b) => b.addedAt - a.addedAt);
                persist(s);
            }
        }
        localStorage.setItem(LEGACY_MERGED_KEY, "1");
    } catch { /* storage blocked: try again next load */ }
    return s;
}

function load(): LibraryState {
    if (typeof window === "undefined") return serverState;
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return mergeLegacyWatchlist(sanitizeState(JSON.parse(raw)));
    } catch { /* fall through to a fresh state */ }
    const fresh = migrateLegacy(defaultState());
    persist(fresh);
    return fresh;
}

function persist(next: LibraryState) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        const s = next.settings;
        localStorage.setItem(PREFS_KEY, JSON.stringify({ theme: s.theme, accent: s.accent, density: s.density, motion: s.reducedMotion ? "reduce" : "" }));
    } catch {
        // Storage full or blocked (private mode): keep working in memory
    }
}

export function getState(): LibraryState {
    if (typeof window === "undefined") return serverState;
    if (!state) state = load();
    return state;
}

function emit() {
    listeners.forEach((l) => l());
}

function update(mutator: (draft: LibraryState) => void) {
    // structuredClone keeps every snapshot immutable for React
    const draft = structuredClone(getState());
    mutator(draft);
    state = draft;
    cachedTogetherSet = null;
    persist(draft);
    emit();
}

export function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

if (typeof window !== "undefined") {
    // Another tab changed the library
    window.addEventListener("storage", (e) => {
        if (e.key === STORAGE_KEY) {
            state = null;
            cachedTogetherSet = null;
            emit();
        }
    });
}

/** Subscribe to a slice of the library. The selector must return stable references (state slices or primitives). */
export function useLibrary<T>(selector: (s: LibraryState) => T): T {
    return useSyncExternalStore(subscribe, () => selector(getState()), () => selector(serverState));
}

/** True after hydration; use to avoid rendering personal UI on the server. */
export function useHydrated() {
    return useSyncExternalStore(noopSubscribe, () => true, () => false);
}
const noopSubscribe = () => () => { };

const activeData = (s: LibraryState) => s.data[s.activeProfile] ?? emptyProfileData();

export const selectActiveProfile = (s: LibraryState) => s.profiles.find((p) => p.id === s.activeProfile) ?? s.profiles[0];
export const selectData = (s: LibraryState) => activeData(s);

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

/**
 * Pass `type` for TMDB details objects: they carry no media_type, and TV
 * details have an unrelated `type` field ("Scripted", "Reality", ...).
 */
export function toTitleRef(m: any, type?: MediaType): TitleRef | null {
    return sanitizeTitle({
        ...m,
        type: type ?? m?.type ?? m?.media_type,
        title: m?.title || m?.name,
    });
}

let cachedTogetherSet: Set<string> | null = null;
function getTogetherSet(): Set<string> {
    if (!cachedTogetherSet) {
        const s = getState();
        cachedTogetherSet = new Set(s.couple.together.filter((i) => i.watchedAt).map((i) => `${i.type}:${i.id}`));
    }
    return cachedTogetherSet;
}

type PersonalList = "watchlist" | "favourites";

export const lib = {
    // Fast O(1) couple together check
    isTogether(type: string, id: string | number): boolean {
        if (typeof window === "undefined") return false;
        return getTogetherSet().has(`${type}:${id}`);
    },
    // Personal lists (per profile)
    has(list: PersonalList, type: string, id: string | number) {
        return activeData(getState())[list].some((i) => i.type === type && i.id === String(id));
    },
    toggle(list: PersonalList, title: TitleRef): boolean {
        let added = false;
        update((d) => {
            const data = activeData(d);
            const idx = data[list].findIndex((i) => i.type === title.type && i.id === title.id);
            if (idx >= 0) data[list].splice(idx, 1);
            else {
                data[list].unshift({ ...title, addedAt: Date.now(), addedBy: d.activeProfile });
                added = true;
            }
        });
        return added;
    },
    /** Idempotent add/remove, unlike toggle(): safe when the UI state may be stale. */
    set(list: PersonalList, title: TitleRef, present: boolean) {
        if (lib.has(list, title.type, title.id) === present) return;
        update((d) => {
            const data = activeData(d);
            data[list] = data[list].filter((i) => !(i.type === title.type && i.id === title.id));
            if (present) data[list].unshift({ ...title, addedAt: Date.now(), addedBy: d.activeProfile });
        });
    },
    remove(list: PersonalList, type: string, id: string) {
        update((d) => {
            const data = activeData(d);
            data[list] = data[list].filter((i) => !(i.type === type && i.id === id));
        });
    },

    // Watched marks
    setWatched(type: string, id: string, watched: boolean) {
        update((d) => {
            const data = activeData(d);
            const k = keyOf(type, id);
            if (watched) data.watched[k] = Date.now();
            else delete data.watched[k];
        });
    },

    // History + progress
    recordPlay(item: Omit<HistoryItem, "last_played">) {
        const t = sanitizeTitle(item);
        if (!t) return;
        update((d) => {
            const data = activeData(d);
            const prev = data.history.find((h) => h.type === t.type && h.id === t.id);
            const sameEpisode = prev && prev.season === item.season && prev.episode === item.episode;
            data.history = data.history.filter((h) => !(h.type === t.type && h.id === t.id));
            data.history.unshift({
                ...t,
                season: item.season,
                episode: item.episode,
                tagline: item.tagline,
                progress: sameEpisode ? prev?.progress : undefined,
                last_played: Date.now(),
            });
            data.history = data.history.slice(0, MAX_HISTORY);
        });
    },
    /** Only called with real positions reported by the player */
    recordProgress(type: MediaType, id: string, position: number, duration: number, season?: number, episode?: number) {
        if (!(duration > 30) || !(position >= 0) || position > duration + 5) return;
        update((d) => {
            const data = activeData(d);
            const k = progressKey(type, id, season, episode);
            data.progress[k] = { position: Math.round(position), duration: Math.round(duration), updatedAt: Date.now() };
            const h = data.history.find((x) => x.type === type && x.id === id);
            const ratio = Math.min(1, position / duration);
            if (h && (type === "movie" || (h.season === season && h.episode === episode))) h.progress = ratio;
            // Finished a movie for real → mark it watched
            if (type === "movie" && ratio >= 0.92) data.watched[keyOf(type, id)] = Date.now();
            // Keep the progress map bounded
            const keys = Object.keys(data.progress);
            if (keys.length > 300) {
                keys.sort((a, b) => data.progress[a].updatedAt - data.progress[b].updatedAt)
                    .slice(0, keys.length - 300).forEach((k2) => delete data.progress[k2]);
            }
        });
    },
    removeFromHistory(type: string, id: string) {
        update((d) => {
            const data = activeData(d);
            data.history = data.history.filter((h) => !(h.type === type && h.id === id));
        });
    },
    clearHistory() {
        update((d) => {
            const data = activeData(d);
            data.history = [];
            data.progress = {};
        });
    },

    // Searches
    addRecentSearch(q: string) {
        const query = q.trim().slice(0, 80);
        if (query.length < 2) return;
        update((d) => {
            const data = activeData(d);
            data.recentSearches = [query, ...data.recentSearches.filter((s) => s.toLowerCase() !== query.toLowerCase())].slice(0, MAX_SEARCHES);
        });
    },
    clearRecentSearches() {
        update((d) => { activeData(d).recentSearches = []; });
    },

    // Profiles
    setActiveProfile(id: string) {
        update((d) => { if (d.profiles.some((p) => p.id === id)) d.activeProfile = id; });
    },
    updateProfile(id: string, patch: Partial<Omit<Profile, "id">>) {
        update((d) => {
            const p = d.profiles.find((x) => x.id === id);
            if (!p) return;
            if (patch.name !== undefined) p.name = patch.name.trim().slice(0, 24) || p.name;
            if (patch.avatar !== undefined) p.avatar = patch.avatar.slice(0, 8) || p.avatar;
            if (patch.color !== undefined && /^#[0-9a-f]{6}$/i.test(patch.color)) p.color = patch.color;
        });
    },

    // Couple space
    inTogether(type: string, id: string | number) {
        return getState().couple.together.some((i) => i.type === type && i.id === String(id));
    },
    toggleTogether(title: TitleRef): boolean {
        let added = false;
        update((d) => {
            const idx = d.couple.together.findIndex((i) => i.type === title.type && i.id === title.id);
            if (idx >= 0) d.couple.together.splice(idx, 1);
            else {
                d.couple.together.unshift({ ...title, addedAt: Date.now(), addedBy: d.activeProfile });
                added = true;
            }
        });
        return added;
    },
    setWatchedTogether(type: string, id: string, watched: boolean) {
        update((d) => {
            const item = d.couple.together.find((i) => i.type === type && i.id === id);
            if (item) item.watchedAt = watched ? Date.now() : undefined;
        });
    },
    inOurFavourites(type: string, id: string | number) {
        return getState().couple.ourFavourites.some((i) => i.type === type && i.id === String(id));
    },
    toggleOurFavourite(title: TitleRef): boolean {
        let added = false;
        update((d) => {
            const idx = d.couple.ourFavourites.findIndex((i) => i.type === title.type && i.id === title.id);
            if (idx >= 0) d.couple.ourFavourites.splice(idx, 1);
            else {
                d.couple.ourFavourites.unshift({ ...title, addedAt: Date.now(), addedBy: d.activeProfile });
                added = true;
            }
        });
        return added;
    },
    updateFavouritesFeature(patch: { title?: string; description?: string; cover?: string }) {
        update((d) => {
            if (patch.title !== undefined) d.couple.favouritesTitle = patch.title.slice(0, 60) || "Our favourite movies";
            if (patch.description !== undefined) d.couple.favouritesDescription = patch.description.slice(0, 300);
            if (patch.cover !== undefined) d.couple.favouritesCover = sanitizeCover(patch.cover);
        });
    },
    setSince(date: string) {
        update((d) => { d.couple.since = /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : ""; });
    },
    addPlan(item: TitleRef, when: string, note: string): DatePlan | null {
        const plan = sanitizePlan({ id: uid(), item, when, note, createdAt: Date.now(), createdBy: getState().activeProfile });
        if (!plan) return null;
        update((d) => {
            d.couple.plans = [plan, ...d.couple.plans.filter((p) => p.id !== plan.id)].slice(0, 50);
        });
        return plan;
    },
    importPlan(plan: DatePlan) {
        const clean = sanitizePlan(plan);
        if (!clean) return;
        update((d) => { d.couple.plans = [clean, ...d.couple.plans.filter((p) => p.id !== clean.id)].slice(0, 50); });
    },
    removePlan(id: string) {
        update((d) => { d.couple.plans = d.couple.plans.filter((p) => p.id !== id); });
    },
    mergeTogether(items: TitleRef[]): number {
        let added = 0;
        update((d) => {
            for (const raw of items) {
                const t = sanitizeTitle(raw);
                if (!t || d.couple.together.some((i) => i.type === t.type && i.id === t.id)) continue;
                d.couple.together.push({ ...t, addedAt: Date.now() });
                added++;
            }
        });
        return added;
    },

    // Collections
    createCollection(name: string, description = "", emoji = "🎬", items: TitleRef[] = []): Collection {
        const now = Date.now();
        const col: Collection = {
            id: uid(),
            name: name.trim().slice(0, 60) || "Untitled collection",
            description: description.trim().slice(0, 300),
            emoji: emoji.slice(0, 8) || "🎬",
            items: dedupe(items.map((i) => sanitizeTitle(i)).filter(Boolean).map((t) => ({ ...(t as TitleRef), addedAt: now }))),
            createdAt: now,
            updatedAt: now,
            createdBy: getState().activeProfile,
        };
        update((d) => { d.collections.unshift(col); });
        return col;
    },
    updateCollection(id: string, patch: { name?: string; description?: string; emoji?: string }) {
        update((d) => {
            const c = d.collections.find((x) => x.id === id);
            if (!c) return;
            if (patch.name !== undefined) c.name = patch.name.trim().slice(0, 60) || c.name;
            if (patch.description !== undefined) c.description = patch.description.trim().slice(0, 300);
            if (patch.emoji !== undefined) c.emoji = patch.emoji.slice(0, 8) || c.emoji;
            c.updatedAt = Date.now();
        });
    },
    deleteCollection(id: string) {
        update((d) => { d.collections = d.collections.filter((c) => c.id !== id); });
    },
    inCollection(colId: string, type: string, id: string | number) {
        return !!getState().collections.find((c) => c.id === colId)?.items.some((i) => i.type === type && i.id === String(id));
    },
    toggleInCollection(colId: string, title: TitleRef): boolean {
        let added = false;
        update((d) => {
            const c = d.collections.find((x) => x.id === colId);
            if (!c) return;
            const idx = c.items.findIndex((i) => i.type === title.type && i.id === title.id);
            if (idx >= 0) c.items.splice(idx, 1);
            else {
                c.items.unshift({ ...title, addedAt: Date.now(), addedBy: d.activeProfile });
                added = true;
            }
            c.updatedAt = Date.now();
        });
        return added;
    },

    // Settings
    updateSettings(patch: Partial<Settings>) {
        update((d) => {
            d.settings = sanitizeState({ ...d, settings: { ...d.settings, ...patch } }).settings;
        });
    },

    // Backup
    exportJSON(): string {
        return JSON.stringify({ app: "gedatv", exportedAt: new Date().toISOString(), ...getState() }, null, 2);
    },
    importJSON(json: string): boolean {
        try {
            const parsed = JSON.parse(json);
            if (!parsed || typeof parsed !== "object" || !parsed.data) return false;
            const next = sanitizeState(parsed);
            state = next;
            persist(next);
            emit();
            return true;
        } catch {
            return false;
        }
    },
    resetAll() {
        const fresh = defaultState();
        state = fresh;
        persist(fresh);
        try {
            localStorage.removeItem(LEGACY_WATCHLIST);
            localStorage.removeItem(LEGACY_RECENT);
        } catch { /* ignore */ }
        emit();
    },
};
