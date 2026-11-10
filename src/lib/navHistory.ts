"use client";

// Counts route changes in this tab so "Back" can tell whether the previous
// history entry is part of GedaTv. On a shared or bookmarked link it isn't,
// and history.back() would leave the site.
let routeChanges = 0;

export function noteRouteChange() {
    routeChanges++;
}

export function goBackOrHome(router: { back: () => void; push: (href: string) => void }) {
    if (routeChanges > 1) router.back();
    else router.push("/");
}
