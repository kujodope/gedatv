"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { lib } from "@/lib/library";
import { normalizeQuery, peekSearch, prefetchSearch } from "@/lib/searchClient";

// Pause after the last keystroke before results update. Short enough to feel
// live, long enough not to send a request for every letter.
const TYPING_DELAY_MS = 200;

const searchUrl = (raw: string) => {
    const q = raw.trim().replace(/\s+/g, " ");
    return q ? `/search?q=${encodeURIComponent(q)}` : "/search";
};

// State and behaviour of a search box (navbar on desktop, search page on
// phones). Results update while typing:
//  - the request starts as soon as typing pauses, before any navigation;
//  - on /search the address bar is updated in place (no server round trip);
//  - elsewhere the first pause opens /search, later ones replace that entry.
export function useSearchInput() {
    const router = useRouter();
    const [value, setValue] = useState("");
    // True from the first keystroke until results for the typed text are in
    const [isPending, setIsPending] = useState(false);
    const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const latestQuery = useRef("");
    // The last address this box wrote; seeing it come back isn't a new search
    const lastWritten = useRef<string | null>(null);
    const openingSearch = useRef(false);

    const fetchResults = useCallback((raw: string) => {
        const q = normalizeQuery(raw);
        latestQuery.current = q;
        if (!q || peekSearch(q)) {
            setIsPending(false);
            return;
        }
        setIsPending(true);
        prefetchSearch(q).finally(() => {
            if (latestQuery.current === q) setIsPending(false);
        });
    }, []);

    const showResults = useCallback((raw: string) => {
        const url = searchUrl(raw);
        lastWritten.current = new URL(url, window.location.origin).searchParams.get("q") || "";
        if (window.location.pathname === "/search") {
            openingSearch.current = false;
            // Next.js syncs useSearchParams with history.replaceState, so the
            // results update without fetching the page again
            window.history.replaceState(null, "", url);
        } else if (url !== "/search") {
            if (openingSearch.current) router.replace(url);
            else router.push(url);
            openingSearch.current = true;
        }
    }, [router]);

    const onChange = useCallback((raw: string) => {
        setValue(raw);
        clearTimeout(timer.current);
        // Feedback on the very first keystroke, before any request goes out
        const q = normalizeQuery(raw);
        setIsPending(!!q && !peekSearch(q));
        timer.current = setTimeout(() => {
            fetchResults(raw);
            showResults(raw);
        }, TYPING_DELAY_MS);
    }, [fetchResults, showResults]);

    const submit = useCallback((raw: string = value) => {
        clearTimeout(timer.current);
        if (raw !== value) setValue(raw);
        fetchResults(raw);
        showResults(raw);
        if (raw.trim()) lib.addRecentSearch(raw.trim());
    }, [value, fetchResults, showResults]);

    // The address changed (back button, a link, first load): show its query,
    // unless it's the one this box just wrote while someone is still typing
    const syncFromUrl = useCallback((q: string) => {
        if (q === lastWritten.current) return;
        lastWritten.current = q;
        clearTimeout(timer.current);
        setValue(q);
        latestQuery.current = normalizeQuery(q);
        setIsPending(false);
    }, []);

    useEffect(() => () => clearTimeout(timer.current), []);

    return { value, isPending, onChange, submit, syncFromUrl };
}
