import { tmdbConfigured } from "@/lib/tmdb";

// True when a browse page has nothing to show and should render the
// "catalogue unavailable" notice.
//
// With a TMDB key configured, an empty main list means TMDB failed during
// this render. Throwing then keeps the previous hourly version of the page
// on the CDN instead of replacing it with an empty one for an hour (errors
// are never cached). The build itself must not fail, so it bakes in the
// notice instead, and the next hourly refresh replaces it.
export function catalogMissing(items: unknown[]): boolean {
    if (items.length > 0) return false;
    if (tmdbConfigured && process.env.NEXT_PHASE !== "phase-production-build") {
        throw new Error("TMDB returned an empty catalogue");
    }
    return true;
}
