import { tmdb } from "@/lib/tmdb";
import { badRequest, cachedJson, parseId, parseMediaType, uncachedJson } from "@/lib/apiResponse";

// GET /api/trailer?type=movie&id=550 → { url: string | null }
export async function GET(request: Request) {
    const params = new URL(request.url).searchParams;
    const type = parseMediaType(params.get("type"));
    const id = parseId(params.get("id"));
    if (!type || !id) return badRequest("Bad type/id");

    try {
        const url = await tmdb.getTrailer(type, id);
        return cachedJson({ url }, { cdn: 60 * 60 * 6, browser: 60 * 60, varyOn: ["type", "id"] });
    } catch {
        return uncachedJson({ error: "Trailer lookup failed" }, 503);
    }
}
