import { GENRE_ROWS, getGenreRows, type GenreRowType } from "@/lib/genreRows";
import { badRequest, cachedJson, parseIntInRange, uncachedJson } from "@/lib/apiResponse";

// GET /api/genres?type=all&start=0&limit=2 — the next batch of genre rows
export async function GET(request: Request) {
    const params = new URL(request.url).searchParams;
    const type = (params.get("type") || "all") as GenreRowType;
    if (!(type in GENRE_ROWS)) return badRequest("Unknown type");
    const start = parseIntInRange(params.get("start"), 0, 50, 0);
    const limit = parseIntInRange(params.get("limit"), 1, 4, 2);
    if (start === null || limit === null) return badRequest("Bad start/limit");

    const rows = await getGenreRows(type, start, limit);
    const requested = GENRE_ROWS[type].slice(start, start + limit).length;
    // A batch with a missing row means TMDB failed for it: don't cache that
    if (rows.length < requested) return uncachedJson(rows);
    return cachedJson(rows, { cdn: 60 * 60, varyOn: ["type", "start", "limit"] });
}
