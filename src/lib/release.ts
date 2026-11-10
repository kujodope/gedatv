import { useState } from "react";
import { useHydrated } from "@/lib/library";

const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;

/**
 * "Coming soon" / "released recently" for a title. Pages are cached and can be
 * hours or days old when they hydrate, so until hydration this uses the time
 * the server rendered the page (`renderedAt`); comparing against today instead
 * could produce different markup, and React would then throw the whole page
 * away and render it again in the browser. Right after hydration it uses today.
 */
export function useReleaseStatus(dateStr: string | undefined, renderedAt?: number) {
    const hydrated = useHydrated();
    const [clientNow] = useState(() => Date.now());
    const now = hydrated || renderedAt === undefined ? clientNow : renderedAt;
    const release = dateStr ? new Date(dateStr).getTime() : null;
    const isReleased = release === null ? true : release <= now;
    const isRecentRelease = release !== null && release <= now && release >= now - TWO_DAYS_MS;
    return { isReleased, isRecentRelease };
}
