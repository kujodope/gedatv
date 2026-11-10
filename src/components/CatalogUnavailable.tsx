import Link from "next/link";
import { CloudOff } from "lucide-react";

// Shown when every list on a browse page came back empty (TMDB unreachable or
// not configured), instead of an empty page under the navbar
export default function CatalogUnavailable() {
    return (
        <div className="page-top page-gutter pb-10">
            <div className="surface flex flex-col items-center justify-center px-6 py-24 text-center">
                <div className="mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-white/[0.05] ring-1 ring-white/10">
                    <CloudOff className="h-6 w-6 text-subtle" aria-hidden="true" />
                </div>
                <h2 className="font-display text-2xl font-bold text-white">Titles are taking a break</h2>
                <p className="mt-2 max-w-md text-[15px] text-muted">
                    We couldn&apos;t reach the movie database just now. Your list and history are still here.
                </p>
                <div className="mt-7 flex flex-wrap justify-center gap-3">
                    <Link href="/watchlist" className="btn btn-primary">Open My List</Link>
                    <Link href="/search" className="btn btn-ghost">Search</Link>
                </div>
            </div>
        </div>
    );
}
