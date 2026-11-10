import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * JSON for an inline <script type="application/ld+json">. TMDB text is
 * user-editable, so "<" is escaped to stop a "</script>" in an overview from
 * closing the tag and injecting markup.
 */
export function jsonLdScript(data: unknown) {
    return JSON.stringify(data).replace(/</g, "\u003c");
}
