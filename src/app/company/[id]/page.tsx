import React from "react";
import { tmdb, TMDB_CONFIG, isNotFound } from "@/lib/tmdb";
import { notFound } from "next/navigation";
import CompanyDetailsClient from "@/components/CompanyDetailsClient";

interface CompanyPageProps {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: CompanyPageProps) {
    const { id } = await params;
    const company = await tmdb.getCompanyDetails(id);
    if (!company) return { title: "Studio" };

    return {
        title: `${company.name}`,
        description: `Explore movies and TV shows produced by ${company.name}.`,
        openGraph: {
            title: `${company.name} | GedaTv`,
            description: `Explore movies and TV shows produced by ${company.name}.`,
            images: company.logo_path ? [
                {
                    url: `${TMDB_CONFIG.imageBase}/w500${company.logo_path}`,
                    alt: company.name
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

export default async function CompanyPage({ params }: CompanyPageProps) {
    const { id } = await params;
    const company = await tmdb.getCompanyDetails(id);

    // A title that genuinely doesn't exist gets a real 404
    if (isNotFound(company)) notFound();
    if (!company?.id) {
        // Errors are never cached, so a temporary TMDB failure can't stick on the CDN
        throw new Error(`Could not load studio ${id}`);
    }

    const [moviesData, tvShowsData] = await Promise.all([
        tmdb.getDiscoverByCompany(id, "movie"),
        tmdb.getDiscoverByCompany(id, "tv")
    ]);

    const movies = moviesData?.results || [];
    const tvShows = tvShowsData?.results || [];

    // Find the most popular movie/show with a backdrop path to use as a beautiful header background
    const allItems = [...movies, ...tvShows].sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    const bestBackdrop = allItems.find(item => item.backdrop_path)?.backdrop_path;
    // Shown blurred and dimmed behind the header, so the 780px file looks the same as 1280px
    const backdropUrl = bestBackdrop ? `${TMDB_CONFIG.backdropSizes.medium}${bestBackdrop}` : null;

    return (
        <main className="min-h-screen bg-black pb-20">
            <CompanyDetailsClient 
                company={company}
                movies={movies}
                tvShows={tvShows}
                backdropUrl={backdropUrl}
                moviesTotalResults={moviesData?.totalResults || 0}
                tvShowsTotalResults={tvShowsData?.totalResults || 0}
                moviesTotalPages={moviesData?.totalPages || 1}
                tvShowsTotalPages={tvShowsData?.totalPages || 1}
            />
        </main>
    );
}
