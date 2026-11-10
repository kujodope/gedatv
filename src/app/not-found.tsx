import Link from "next/link";
import { SearchX } from "lucide-react";

export default function NotFound() {
    return (
        <main className="min-h-[80vh] flex items-center justify-center page-gutter page-top pb-16 text-center">
            <div className="max-w-md space-y-5">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-accent-soft ring-1 ring-accent/30"><SearchX className="w-7 h-7 text-accent" aria-hidden="true" /></div>
                <h1 className="font-display text-3xl md:text-4xl font-extrabold tracking-tight text-white">We couldn&apos;t find that</h1>
                <p className="text-muted leading-relaxed">This title or page doesn&apos;t exist, or it was removed from the movie database.</p>
                <div className="flex items-center justify-center gap-3">
                    <Link href="/" className="btn btn-primary">
                        Home
                    </Link>
                    <Link href="/search" className="btn btn-ghost">
                        Search
                    </Link>
                </div>
            </div>
        </main>
    );
}
