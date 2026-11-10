import React from "react";
import { tmdb, TMDB_CONFIG, isNotFound } from "@/lib/tmdb";
import { notFound } from "next/navigation";
import NetworkDetailsClient from "@/components/NetworkDetailsClient";

interface NetworkPageProps {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: NetworkPageProps) {
    const { id } = await params;
    const network = await tmdb.getNetworkDetails(id);
    if (!network) return { title: "Network" };

    return {
        title: `${network.name}`,
        description: `Explore TV shows on the ${network.name} network.`,
        openGraph: {
            title: `${network.name} | GedaTv`,
            description: `Explore TV shows on the ${network.name} network.`,
            images: network.logo_path ? [
                {
                    url: `${TMDB_CONFIG.imageBase}/w500${network.logo_path}`,
                    alt: network.name
                }
            ] : []
        }
    };
}

// Rendered on first visit, then served from the CDN and refreshed hourly
export const revalidate = 3600;

export async function generateStaticParams() {
    return [];
}

export default async function NetworkPage({ params }: NetworkPageProps) {
    const { id } = await params;
    const network = await tmdb.getNetworkDetails(id);

    // A title that genuinely doesn't exist gets a real 404
    if (isNotFound(network)) notFound();
    if (!network?.id) {
        // Errors are never cached, so a temporary TMDB failure can't stick on the CDN
        throw new Error(`Could not load network ${id}`);
    }

    const tvShowsData = await tmdb.getDiscoverByNetwork(id);
    const tvShows = tvShowsData?.results || [];

    // Find the most popular show with a backdrop path to use as a beautiful header background
    const bestBackdrop = tvShows.find(item => item.backdrop_path)?.backdrop_path;
    // Shown blurred and dimmed behind the header, so the 780px file looks the same as 1280px
    const backdropUrl = bestBackdrop ? `${TMDB_CONFIG.backdropSizes.medium}${bestBackdrop}` : null;

    return (
        <main className="min-h-screen bg-black pb-20">
            <NetworkDetailsClient 
                network={network}
                tvShows={tvShows}
                backdropUrl={backdropUrl}
                tvShowsTotalResults={tvShowsData?.totalResults || 0}
                tvShowsTotalPages={tvShowsData?.totalPages || 1}
            />
        </main>
    );
}
