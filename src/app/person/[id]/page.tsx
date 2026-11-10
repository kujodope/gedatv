
import React from 'react';
import { tmdb, TMDB_CONFIG, toListItem, isNotFound } from '@/lib/tmdb';
import { notFound } from 'next/navigation';

import PersonDetailsClient from '@/components/PersonDetailsClient';

interface PersonPageProps {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PersonPageProps) {
    const { id } = await params;
    const person = await tmdb.getPersonDetails(id);
    if (!person) return { title: "Person" };

    return {
        title: `${person.name}`,
        description: person.biography,
        openGraph: {
            title: `${person.name} | GedaTv`,
            description: person.biography,
            images: [
                {
                    url: `https://image.tmdb.org/t/p/w500${person.profile_path}`,
                    width: 500,
                    height: 750,
                    alt: person.name
                },
            ],
        },
    };
}

// Rendered on first visit, then served from the CDN and refreshed hourly
export const revalidate = 3600;

export async function generateStaticParams() {
    return [];
}

export default async function PersonPage({ params }: PersonPageProps) {
    const { id } = await params;
    const [person, credits] = await Promise.all([
        tmdb.getPersonDetails(id),
        tmdb.getPersonCredits(id),
    ]);
    // A title that genuinely doesn't exist gets a real 404
    if (isNotFound(person)) notFound();
    if (!person?.id) {
        // Errors are never cached, so a temporary TMDB failure can't stick on the CDN
        throw new Error(`Could not load person ${id}`);
    }

    // Filter credits to unique and popular ones, sort by popularity
    const uniqueCreditsMap = new Map();
    credits.cast?.forEach((m: any) => {
        const key = `${m.id}-${m.media_type}`;
        if (!uniqueCreditsMap.has(key)) {
            uniqueCreditsMap.set(key, m);
        }
    });

    const knownFor = Array.from(uniqueCreditsMap.values())
        .sort((a: any, b: any) => b.popularity - a.popularity)
        .slice(0, 20)
        .map((m: any) => toListItem(m));

    const bestBackdrop = knownFor.find((m: any) => m.backdrop_path)?.backdrop_path;
    // Shown blurred and dimmed behind the header, so the 780px file looks the same as 1280px
    const backdropUrl = bestBackdrop ? `${TMDB_CONFIG.backdropSizes.medium}${bestBackdrop}` : null;

    const profileUrl = person.profile_path
        ? `${TMDB_CONFIG.posterSizes.medium}${person.profile_path}`
        : null;

    return (
        <main className="min-h-screen bg-black pb-20">
            <PersonDetailsClient 
                person={person}
                knownFor={knownFor}
                backdropUrl={backdropUrl}
                profileUrl={profileUrl}
            />
        </main>
    );
}
