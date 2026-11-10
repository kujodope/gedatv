"use server";

import { tmdb } from "@/lib/tmdb";
import { redirect } from "next/navigation";

// Read-only data the browser fetches (search, genre rows, seasons, trailers,
// studio/network pages) is served by the cacheable GET routes in src/app/api.
// Server actions are POSTs that run one at a time and can't be cached.

export async function surpriseMe() {
    const movie = await tmdb.getRandomContent();
    if (movie) {
        redirect(`/watch/${movie.media_type}/${movie.id}`);
    }
}

export async function getMoctaleReviewsAction(slug: string) {
    try {
        const url = `https://www.moctale.in/api/activity/content/${slug}/reviews-summary`;
        const cookie = process.env.MOCTALE_COOKIE || "";

        let finalCookie = cookie;
        if (cookie.includes('auth_token=')) {
            const match = cookie.match(/auth_token=([^;]+)/);
            if (match) {
                finalCookie = `auth_token=${match[1]}`;
            }
        } else if (cookie && !cookie.includes('=')) {
            finalCookie = `auth_token=${cookie}`;
        }



        const headers = {
            'accept': '*/*',
            'accept-language': 'en-US,en;q=0.9,hi;q=0.8',
            'cache-control': 'no-cache',
            'dnt': '1',
            'pragma': 'no-cache',
            'priority': 'u=1, i',
            'referer': `https://www.moctale.in/content/${slug}`,
            'sec-ch-ua-mobile': '?0',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-origin',
            'cookie': finalCookie
        };

        // Loaded on demand: got-scraping and its browser-fingerprint data are
        // large, and only the reviews tab needs them, so other server work
        // (every page render, every cold start) doesn't pay to load them
        const { gotScraping } = await import("got-scraping");
        const res = await gotScraping({
            url: url,
            method: 'GET',
            headers: headers,
            retry: { limit: 0 } // Do not retry on failure to prevent rate-limiting
        });

        if (res.statusCode !== 200) {
            console.error(`Moctale Reviews fetch failed for slug ${slug}: ${res.statusCode}`);
            return { error: `Moctale API returned ${res.statusCode}`, status: res.statusCode };
        }

        const data = JSON.parse(res.body);
        return { data };
    } catch (error: any) {
        console.error(`Moctale Reviews action exception for slug ${slug}:`, error.message || error);
        return { error: error.message || "Unknown error" };
    }
}
