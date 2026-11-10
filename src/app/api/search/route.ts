import { tmdb } from "@/lib/tmdb";
import { normalizeQuery } from "@/lib/searchQuery";
import { badRequest, cachedJson, uncachedJson } from "@/lib/apiResponse";

// GET /api/search?q=dune
export async function GET(request: Request) {
    const q = normalizeQuery(new URL(request.url).searchParams.get("q"));
    if (!q) return badRequest("Missing q");

    try {
        const results = await tmdb.search(q);
        // "No matches" isn't cached, so a title added to TMDB later shows up
        if (results.length === 0) return uncachedJson(results);
        return cachedJson(results, { cdn: 60 * 60 * 24, browser: 60 * 10, varyOn: ["q"] });
    } catch {
        return uncachedJson({ error: "Search is unavailable" }, 503);
    }
}
