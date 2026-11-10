// TMDB image URL helpers (client-safe, no API key involved).
// TMDB serves these widths for any image, so the browser can pick the
// smallest file that is still sharp for the rendered size and pixel density.
const BASE = "https://image.tmdb.org/t/p";

export function tmdbImage(size: string, path?: string | null) {
    return path ? `${BASE}/${size}${path}` : undefined;
}

function srcSet(path: string, widths: number[]) {
    return widths.map((w) => `${BASE}/w${w}${path} ${w}w`).join(", ");
}

// Landscape artwork (backdrops, episode stills)
export const backdropSrcSet = (path: string) => srcSet(path, [300, 500, 780]);
// Portrait artwork (posters, profile photos)
export const posterSrcSet = (path: string) => srcSet(path, [185, 342, 500]);
// Hero-sized backdrops
export const heroSrcSet = (path: string) => srcSet(path, [780, 1280]);

// Width classes of a portrait MovieCard inside a horizontal row (kept in
// sync with ROW_CARD_SIZES; skeletons use the same classes so nothing shifts
// when the real cards arrive)
export const ROW_CARD_WIDTH = "flex-none w-[112px] sm:w-[124px] md:w-[136px] lg:w-[156px] xl:w-[172px]";

// Rendered widths of a MovieCard inside a horizontal row (see ROW_CARD_WIDTH)
export const ROW_CARD_SIZES =
    "(min-width: 1280px) 172px, (min-width: 1024px) 156px, (min-width: 768px) 136px, (min-width: 640px) 124px, 112px";
// Rendered widths of a MovieCard in the responsive grids (2 → 3 → 4 → 5 columns)
export const GRID_CARD_SIZES = "(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw";
// Portrait poster cards (Top 10 row)
export const POSTER_CARD_SIZES = "(min-width: 1024px) 160px, (min-width: 640px) 136px, 112px";
