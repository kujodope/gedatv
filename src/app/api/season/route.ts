import { tmdb, isNotFound } from "@/lib/tmdb";
import { badRequest, cachedJson, parseId, parseIntInRange, uncachedJson } from "@/lib/apiResponse";

// Fields EpisodeList and the player read; TMDB also sends crew and guest
// stars for every episode, which is most of the payload
const slimEpisode = (e: any) => ({
    id: e.id,
    name: e.name,
    overview: e.overview,
    episode_number: e.episode_number,
    season_number: e.season_number,
    still_path: e.still_path,
    air_date: e.air_date,
    runtime: e.runtime,
    vote_average: e.vote_average,
});

// GET /api/season?id=1399&s=1
export async function GET(request: Request) {
    const params = new URL(request.url).searchParams;
    const id = parseId(params.get("id"));
    const season = parseIntInRange(params.get("s"), 0, 500, 1);
    if (!id || season === null) return badRequest("Bad id/season");

    const data = await tmdb.getSeasonDetails(id, season);
    if (isNotFound(data)) return uncachedJson({ error: "Not found" }, 404);
    if (!data?.episodes) return uncachedJson({ error: "Season is unavailable" }, 503);

    return cachedJson(
        { id: data.id, name: data.name, season_number: data.season_number, episodes: data.episodes.map(slimEpisode) },
        { cdn: 60 * 60 * 6, browser: 60 * 30, varyOn: ["id", "s"] },
    );
}
