/**
 * GedaTv Video Sources & Playback Architecture
 * 
 * Active streaming providers with custom parameters and responsive fallback.
 */

export interface VideoServer {
    name: string;
    description?: string;
    movie: (id: string) => string;
    show: (id: string, season: number, episode: number) => string;
    useSandbox: boolean;
    badge?: string;
}

export const SERVERS: VideoServer[] = [
    {
        name: "Vidy",
        description: "Fast multi-source stream with episode selector",
        movie: (id: string) => `https://www.vidy.st/movie/${id}?color=DC2626`,
        show: (id: string, s: number, e: number) => `https://www.vidy.st/tv/${id}/${s}/${e}?color=DC2626&nextEpisode=true&episodeSelector=true`,
        useSandbox: false,
        badge: "Recommended"
    },
    {
        name: "Filmu",
        description: "Clean player with high compatibility",
        movie: (id: string) => `https://embed.filmu.in/movie/${id}`,
        show: (id: string, s: number, e: number) => `https://embed.filmu.in/tv/${id}/${s}/${e}`,
        useSandbox: false
    },
    {
        name: "PrimeSRC",
        description: "High speed adaptive streams",
        movie: (id: string) => `https://primesrc.me/embed/movie?tmdb=${id}`,
        show: (id: string, s: number, e: number) => `https://primesrc.me/embed/tv?tmdb=${id}&season=${s}&episode=${e}`,
        useSandbox: false,
        badge: "HD"
    },
    {
        name: "Vidrift",
        description: "Branded GedaTv custom player",
        movie: (id: string) => `https://embed.vidrift.in/embed/movie/${id}?brand=GedaTv`,
        show: (id: string, s: number, e: number) => `https://embed.vidrift.in/embed/tv/${id}/${s}/${e}?brand=GedaTv`,
        useSandbox: false
    },
    {
        name: "Vidfast",
        description: "Lightweight fast-loading player",
        movie: (id: string) => `https://vidfast.net/movie/${id}`,
        show: (id: string, s: number, e: number) => `https://vidfast.net/tv/${id}/${s}/${e}`,
        useSandbox: false
    },
    {
        name: "VidSrc PM",
        description: "Popular reliable video source",
        movie: (id: string) => `https://vidsrc.pm/embed/movie/${id}`,
        show: (id: string, s: number, e: number) => `https://vidsrc.pm/embed/tv/${id}/${s}/${e}`,
        useSandbox: false
    },
    {
        name: "Videasy",
        description: "Responsive player with smooth controls",
        movie: (id: string) => `https://player.videasy.net/movie/${id}`,
        show: (id: string, s: number, e: number) => `https://player.videasy.net/tv/${id}/${s}/${e}`,
        useSandbox: false
    },
    {
        name: "2Embed",
        description: "Classic multi-server streaming source",
        movie: (id: string) => `https://www.2embed.skin/embed/${id}`,
        show: (id: string, s: number, e: number) => `https://www.2embed.skin/embedtv/${id}&s=${s}&e=${e}`,
        useSandbox: false
    },
    {
        name: "Cinezo",
        description: "Rich feature player with chromecast and settings",
        movie: (id: string) => `https://player.cinezo.live/embed/movie/${id}?autoplay=false&poster=true&chromecast=true&servericon=true&setting=true&pip=true&font=Roboto&fontcolor=6f63ff&fontsize=20&opacity=0.5&primarycolor=e8b86d&secondarycolor=0a0a12&iconcolor=ffffff`,
        show: (id: string, s: number, e: number) => `https://player.cinezo.live/embed/tv/${id}/${s}/${e}?autoplay=false&poster=true&chromecast=true&servericon=true&setting=true&pip=true&font=Roboto&fontcolor=6f63ff&fontsize=20&opacity=0.5&primarycolor=e8b86d&secondarycolor=0a0a12&iconcolor=ffffff`,
        useSandbox: false
    },
    {
        name: "Vidlink",
        description: "Pro streaming embed",
        movie: (id: string) => `https://vidlink.pro/movie/${id}`,
        show: (id: string, s: number, e: number) => `https://vidlink.pro/tv/${id}/${s}/${e}`,
        useSandbox: false
    },
    {
        name: "Vidrock",
        description: "Rock-solid backup streaming source",
        movie: (id: string) => `https://vidrock.net/embed/movie/${id}`,
        show: (id: string, s: number, e: number) => `https://vidrock.net/embed/tv/${id}/${s}/${e}`,
        useSandbox: false
    }
];

export function getPlayerUrl(
    serverIndex: number,
    type: "movie" | "tv",
    id: string,
    season = 1,
    episode = 1
): string {
    const validIndex = Math.max(0, Math.min(serverIndex, SERVERS.length - 1));
    const server = SERVERS[validIndex];
    return type === "movie" ? server.movie(id) : server.show(id, season, episode);
}

export function getServerByIndex(index: number): VideoServer {
    const validIndex = Math.max(0, Math.min(index, SERVERS.length - 1));
    return SERVERS[validIndex];
}
