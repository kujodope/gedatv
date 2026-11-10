# GedaTv frontend redesign

This branch (`redesign/premium-frontend`) is a frontend-only redesign. The
pre-redesign state is tagged `pre-redesign-baseline`, so any file can be
compared or restored with `git diff pre-redesign-baseline -- <path>` /
`git checkout pre-redesign-baseline -- <path>`.

## 1. Architecture (as found, unchanged)

GedaTv is a single Next.js 16 App Router app deployed to Netlify with
`@netlify/plugin-nextjs`. There is no separate backend service, database or
authentication system: the "backend" is the server-side code inside the app.

| Layer | Files | Role | Touched? |
| --- | --- | --- | --- |
| TMDB client | `src/lib/tmdb.ts` | `fetchTMDB` (retry, 15s timeout, `revalidate: 3600`), list slimming (`toListItem`, `slimDetailsForClient`), the `tmdb.*` methods | **No** |
| Server actions | `src/app/actions.ts` | Season details, surprise-me redirect, trailer lookup, Moctale reviews scraper (`got-scraping`), infinite genre rows, search, trending, genre list, company/network discover paging | **No** |
| Client storage | `src/lib/storage.ts` | Watchlist + recently-played in `localStorage` (`gedatv_watchlist`, `gedatv_recently_played`), legacy-format migration, `watchlistUpdated` / `recentlyPlayedUpdated` events | **No** |
| Edge proxy | `src/proxy.ts` | `www.` → apex 301 redirect | **No** |
| Config / deploy | `next.config.ts`, `netlify.toml`, `package.json`, `public/sw.js` | React Compiler in prod, `image.tmdb.org` remote pattern, Netlify build, self-unregistering legacy service worker | **No** |
| SEO routes | `sitemap.ts`, `robots.ts`, page `metadata` / JSON-LD | | **No** (manifest colors only, see below) |
| Playback | `src/components/VideoPlayer.tsx` `SERVERS` | Third-party embed URLs per server, iframe attributes | **Server list and iframe untouched**; only the control bar markup changed |

Environment variables (read only on the server): `TMDB_API_KEY`
(`NEXT_PUBLIC_TMDB_API_KEY` fallback) and `MOCTALE_COOKIE`. No new variables
were added and none are referenced from client code.

## 2. Data contracts the UI depends on

Server components call `tmdb.*` directly; client components call the server
actions. The UI was written against these shapes and none of them changed.

- **List item (`Movie`)** — `id, media_type ("movie"|"tv"|"person"|"company"), title|name, overview, poster_path, backdrop_path, release_date|first_air_date, vote_average, popularity`; people add `profile_path, known_for_department, known_for[≤3]`; companies add `logo_path, origin_country`. Recently-played items also carry `season, episode, tagline`.
- **Details** (`getDetails`, slimmed by `slimDetailsForClient`) — TMDB details plus `credits {cast, crew(Director/Writer/Screenplay/Author/Teleplay)}`, `images {backdrops, posters(≤18), logos}`, `videos.results`, `recommendations/similar.results (≤10)`, US-only `release_dates` / `content_ratings`, `keywords`, `external_ids`.
- **Season** (`getSeasonDetailsAction`) — `{ episodes: [{id, episode_number, season_number, name, overview, still_path, runtime, air_date}] }`.
- **Search** (`searchAction`) — movies/tv/people from `/search/multi` + companies from `/search/company`.
- **Genre rows** (`getNextGenresAction(start, limit, type)`) — `[{ title, movies }]`.
- **Trailer** (`getTrailerAction`) — YouTube embed URL or `null`.
- **Storage events** — writes dispatch `watchlistUpdated` / `recentlyPlayedUpdated`; the card, hero and rows listen for them.
- **Routes** — `/`, `/movies`, `/tv`, `/categories`, `/categories/[id]?name=&type=`, `/search?q=`, `/watchlist`, `/people`, `/person/[id]`, `/companies`, `/company/[id]`, `/network/[id]`, `/collection/[id]`, `/awards`, `/watch/[type]/[id]?s=&e=&server=&resume=`, `/about`, `/privacy`, `/terms`, `/offline`.

## 3. What changed

### Design system (`src/app/globals.css`, `src/app/layout.tsx`)
- New tokens: ink `#07080b`, surface ramp (`surface`, `surface-2`, `surface-3`), hairline borders (`line`, `line-strong`), text (`muted`, `subtle`), one crimson-rose accent `#f2405a` (the brand heart) and gold `#f5c451` reserved for ratings.
- Stock `white` / `black` / gray utilities retuned to the neutral palette (the old pink/lavender remaps are gone), so untouched markup inherits the new look.
- Shared component classes: `page-gutter`, `page-top`, `eyebrow`, `surface`, `btn` (+ `btn-primary`, `btn-ghost`, `btn-accent`, `btn-icon`, sizes), `chip`, `badge`, `field`, `skeleton`, `scrim-*`.
- Fonts: Inter (UI) + Manrope (headings) via `next/font` (self-hosted at build time), replacing Quicksand.
- Motion: CSS-first entrance animations, Ken Burns hero push-in, slide progress, scroll-driven row reveal; everything respects `prefers-reduced-motion`. Base rules live in `@layer base` so utilities can override them.
- Accessibility: skip-to-content link, visible focus rings, labelled icon buttons, `aria-current`, tab/listbox/radiogroup roles where applicable.

### Shared components
- **Navbar** — full-width bar that is transparent over artwork and solid on scroll (rAF-throttled), underline active state that also matches sub-routes, "More" menu on tablets, wider search with clear/voice, `/` keyboard shortcut, full-screen mobile menu with scroll lock and Escape, plus a **phone bottom tab bar**. All search/URL-sync/voice/surprise-me logic is unchanged.
- **MovieCard** — contained hover (lift, ring, artwork zoom, inline Play / My List / Info) instead of the 1.25× expand, which needed 180–240px padding hacks in every row. Always-visible title, rating, year and TV badge; dedicated person and studio layouts; letterboxed poster fallback; shimmer until artwork loads. Hover trailer preview, trailer cache, prefetch and loading overlay preserved.
- **MovieRow** — calm typographic header (the per-genre rainbow gradients and badges are gone), title links to "See all", scroll-snap, edge-fade arrows, arrow buttons that disable at the ends, empty rows hidden. Lazy artwork limit preserved.
- **Hero** — cinematic full-bleed carousel with rank/eyebrow, logo or display title, real metadata only, Play / More info / Trailer / My List, segmented progress indicators, prev/next, keyboard arrows, and autoplay that pauses on hover, focus, hidden tab or open trailer.
- **Top10Row** (new) — ranked poster row with outline numerals built from the trending list the homepage already fetches (no new requests).
- **DetailsHero** — full-bleed backdrop, poster, tagline, rating/year/runtime/certification/genres, unified action and external-link buttons, season picker.
- **WatchContainer** — sticky underline tabs; the Details tab is a storyline + cast scroller (expandable to a grid) with a facts sidebar (status, dates, runtime, language, seasons, rating, genres), key crew, studios and keywords; collection banner; redesigned clips/photos grids, photo viewer and download toast. All state, season caching, URL params and download logic unchanged.
- **VideoPlayer** — redesigned control bar (now-playing title, source chips, season/episode pickers, reload/share/theater). The `SERVERS` list, iframe and saving to recently played are untouched.
- **EpisodeList**, **Dropdown** (Escape, ARIA listbox), **TrailerModal** (Escape, scroll lock, focus on close button), **Skeleton** (shared shimmer, hero skeleton), **Footer** (multi-column, keeps every original link and the dedication), **PageHeader** (new) and **CatalogUnavailable** (new empty state).

### Pages
Home, Movies, TV, Categories (genre tiles), genre listing (breadcrumb, header, grid, empty state), Search (header, filter chips, browse-by-genre, trending grid, no-results and error states), My List (counts, empty state with calls to action), People / Studios / Awards (shared header), person/studio/network/collection detail polish, error and 404 pages, and loading skeletons.

### Honesty fixes (removed made-up UI)
- The details hero no longer invents values when TMDB has none (it used to show "8.9", "2024" and "1 h 45 min"), and the decorative "X-RAY / HDR / UHD" and hero "4K Ultra HD" badges are gone.
- The rating was labelled "IMDb" but is TMDB's score; it is now labelled TMDB.
- Search-page genre chips linked to `/categories/[id]` without `name`/`type`, which produced a generic "Genre Movies" page; they now pass both.

### Other small frontend edits
- `src/lib/images.ts`: card width classes and `sizes` hints updated for the new card sizes (`ROW_CARD_WIDTH`, `POSTER_CARD_SIZES`).
- `src/app/manifest.ts` and the `themeColor` viewport value: colors updated to the new ink color.
- `FlyingParticles`: flies to whichever "My List" target is visible (desktop link or phone tab bar).

## 4. Known limitations
- `src/components/FilterBar.tsx` is not imported anywhere (dead code before the redesign) and was left as is.
- `MoctaleReviews`, `AwardsClient`, `CompanyDetailsClient` and `NetworkDetailsClient` were restyled through the design tokens and targeted edits rather than rewritten; their internal layouts are the originals.
- Remaining lint output is warnings only (24, down from 37 at baseline): `<img>` vs `next/image` (intentional, since `next/image` would change how TMDB artwork is fetched) and pre-existing unused variables and hook dependencies in untouched logic.
