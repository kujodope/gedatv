import React from "react";
import { jsonLdScript } from "@/lib/utils";
import { tmdb, slimDetailsForClient, isNotFound } from "@/lib/tmdb";
import { notFound } from "next/navigation";
import WatchContainer from "@/components/WatchContainer";

interface WatchPageProps {
    params: Promise<{
        type: "movie" | "tv";
        id: string;
    }>;
}

// Rendered on first visit, then served from the CDN and refreshed hourly.
// Query params (?s=&e=&server=&resume=) are read in the browser by
// WatchContainer, so one cached page serves every episode/server link.
export const revalidate = 3600;

// Only real TMDB ids reach the API; anything else is a 404 rather than an
// arbitrary TMDB path and a new ISR cache entry
const isValidRoute = (type: string, id: string) =>
    (type === "movie" || type === "tv") && /^\d{1,10}$/.test(id);

export async function generateStaticParams() {
    return [];
}

export async function generateMetadata({ params }: WatchPageProps) {
    const { type, id } = await params;
    if (!isValidRoute(type, id)) return { title: "Not found" };
    const movie = await tmdb.getDetails(type, id);

    if (!movie?.id) return { title: "Not found" };

    const title = movie.title || movie.name;
    const year = (movie.release_date || movie.first_air_date)?.split("-")[0];
    const image = movie.backdrop_path ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}` : undefined;

    return {
        title: year ? `${title} (${year})` : title,
        description: movie.overview,
        openGraph: {
            title: `${title} | GedaTv`,
            description: movie.overview,
            images: image ? [{ url: image, width: 1280, height: 720, alt: title }] : undefined,
            type: type === "movie" ? "video.movie" : "video.tv_show",
        },
        twitter: {
            card: "summary_large_image",
            title: `${title} | GedaTv`,
            description: movie.overview,
            images: image ? [image] : undefined,
        }
    };
}

export default async function WatchPage({ params }: WatchPageProps) {
    const { type, id } = await params;
    if (!isValidRoute(type, id)) notFound();
    const movie = await tmdb.getDetails(type, id);

    // A title that genuinely doesn't exist gets a real 404
    if (isNotFound(movie)) notFound();
    // Throw rather than render an error page: errors are never cached, so a
    // temporary TMDB failure can't get stuck on the CDN for an hour.
    if (!movie?.id) {
        throw new Error(`Could not load details for ${type} ${id}`);
    }

    const title = movie.title || movie.name;

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": type === "movie" ? "Movie" : "TVSeries",
        "name": title,
        "description": movie.overview,
        "image": movie.backdrop_path ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}` : undefined,
        "datePublished": movie.release_date || movie.first_air_date,
        "aggregateRating": movie.vote_count ? {
            "@type": "AggregateRating",
            "ratingValue": movie.vote_average,
            "bestRating": "10",
            "worstRating": "1",
            "ratingCount": movie.vote_count
        } : undefined
    };

    return (
        <main className="min-h-screen bg-black pb-20">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }}
            />
            <WatchContainer
                type={type}
                id={id}
                tmdbData={slimDetailsForClient(movie)}
                renderedAt={new Date().getTime()}
            />
        </main>
    );
}
