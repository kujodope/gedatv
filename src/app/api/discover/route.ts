import { tmdb } from "@/lib/tmdb";
import { badRequest, cachedJson, parseId, parseIntInRange, parseMediaType, uncachedJson } from "@/lib/apiResponse";

// More titles for the studio and network pages:
// GET /api/discover?company=420&type=movie&page=2
// GET /api/discover?network=213&page=2
export async function GET(request: Request) {
    const params = new URL(request.url).searchParams;
    const page = parseIntInRange(params.get("page"), 1, 500, 1);
    if (page === null) return badRequest("Bad page");

    const company = parseId(params.get("company"));
    const network = parseId(params.get("network"));
    let data;
    if (company) {
        const type = parseMediaType(params.get("type"));
        if (!type) return badRequest("Bad type");
        data = await tmdb.getDiscoverByCompany(company, type, page);
    } else if (network) {
        data = await tmdb.getDiscoverByNetwork(network, page);
    } else {
        return badRequest("Missing company or network");
    }

    // TMDB answers an empty page past the end; an empty answer can also be an outage
    if (data.results.length === 0) return uncachedJson(data);
    return cachedJson(data, { cdn: 60 * 60, varyOn: ["company", "network", "type", "page"] });
}
