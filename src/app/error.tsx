"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { HeartCrack, RotateCcw } from "lucide-react";

// Shown when a page fails to render (usually TMDB being briefly unreachable).
// Error responses are never cached, so retrying fetches a fresh copy.
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
    const router = useRouter();
    const [isRetrying, startTransition] = useTransition();

    const retry = () => {
        startTransition(() => {
            router.refresh();
            reset();
        });
    };

    return (
        <main className="min-h-[80vh] flex items-center justify-center page-gutter page-top pb-16 text-center">
            <div className="max-w-md space-y-5">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-accent-soft ring-1 ring-accent/30"><HeartCrack className="w-7 h-7 text-accent" aria-hidden="true" /></div>
                <h1 className="font-display text-3xl md:text-4xl font-extrabold tracking-tight text-white">This page couldn&apos;t load</h1>
                <p className="text-muted leading-relaxed">
                    The movie database didn&apos;t respond in time. Check your connection and try again.
                </p>
                <div className="flex items-center justify-center gap-3">
                    <button
                        onClick={retry}
                        disabled={isRetrying}
                        className="btn btn-primary"
                    >
                        <RotateCcw className={isRetrying ? "w-4 h-4 animate-spin" : "w-4 h-4"} aria-hidden="true" />
                        Try again
                    </button>
                    <Link
                        href="/"
                        className="btn btn-ghost"
                    >
                        Home
                    </Link>
                </div>
            </div>
        </main>
    );
}
