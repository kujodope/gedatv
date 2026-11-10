"use client";

import React, { Suspense, useState, useEffect, useRef, useTransition } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
    Search,
    Menu,
    X,
    Dices,
    Mic,
    Heart,
    Home,
    Film,
    ChevronDown,
    Sun,
    Moon,
    Sparkles,
    Loader2,
    Tv
} from "lucide-react";
import { cn } from "@/lib/utils";
import { surpriseMe } from "@/app/actions";
import { useLibrary, lib, selectActiveProfile } from "@/lib/library";
import { useSearchInput } from "@/lib/useSearchInput";

const primaryLinks = [
    { name: "Home", href: "/" },
    { name: "Movies", href: "/movies" },
    { name: "Series", href: "/tv" },
    { name: "Anime", href: "/anime" },
    { name: "Discover", href: "/categories" },
    { name: "List", href: "/watchlist" },
];

const secondaryLinks = [
    { name: "Our Space", href: "/us" },
    { name: "People", href: "/people" },
    { name: "Studios", href: "/companies" },
    { name: "Awards", href: "/awards" },
];

// Bottom tab bar on phones
const tabLinks = [
    { name: "Home", href: "/", icon: Home },
    { name: "Movies", href: "/movies", icon: Film },
    { name: "Anime", href: "/anime", icon: Sparkles },
    { name: "Series", href: "/tv", icon: Tv },
    { name: "Search", href: "/search", icon: Search },
];

const isActivePath = (pathname: string | null, href: string) =>
    href === "/" ? pathname === "/" : !!pathname && (pathname === href || pathname.startsWith(`${href}/`));

// Reads ?q= on /search. Kept in its own Suspense boundary: useSearchParams on
// a static page skips server rendering up to the nearest boundary, and the
// whole navbar used to be that boundary (it only appeared after hydration).
function SearchQuerySync({ onQuery }: { onQuery: (q: string) => void }) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    useEffect(() => {
        if (pathname === "/search") onQuery(searchParams.get("q") || "");
    }, [pathname, searchParams, onQuery]);
    return null;
}

export default function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMoreOpen, setIsMoreOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const search = useSearchInput();
    const searchQuery = search.value;
    const [isPending, startTransition] = useTransition();
    const [isListening, setIsListening] = useState(false);

    const router = useRouter();
    const pathname = usePathname();

    const desktopInputRef = useRef<HTMLInputElement>(null);
    const moreRef = useRef<HTMLLIElement>(null);
    const profileRef = useRef<HTMLDivElement>(null);

    // Couple library state
    const profiles = useLibrary((s) => s.profiles);
    const activeProfile = useLibrary(selectActiveProfile);
    const currentTheme = useLibrary((s) => s.settings.theme);

    // Toggle theme
    const toggleTheme = () => {
        const next = currentTheme === "light" ? "dark" : "light";
        lib.updateSettings({ theme: next });
        if (typeof document !== "undefined") {
            document.documentElement.dataset.theme = next;
        }
    };

    // Keep theme attribute in sync
    useEffect(() => {
        if (typeof document !== "undefined" && currentTheme) {
            // "system" isn't a CSS theme; resolve it like the <head> script does
            document.documentElement.dataset.theme = currentTheme === "system"
                ? (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark")
                : currentTheme;
        }
    }, [currentTheme]);

    // Track scroll
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Close menus on path change
    useEffect(() => {
        setIsMobileMenuOpen(false);
        setIsMoreOpen(false);
        setIsProfileOpen(false);
    }, [pathname]);

    // Close dropdowns on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
                setIsMoreOpen(false);
            }
            if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);


    // Keyboard shortcut '/' to focus search
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (
                e.key === "/" &&
                !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)
            ) {
                e.preventDefault();
                desktopInputRef.current?.focus();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    const handleSearchSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (searchQuery.trim()) {
            search.submit();
            setIsMobileMenuOpen(false);
        }
    };

    const handleVoiceSearch = () => {
        if (typeof window === "undefined") return;
        const SpeechRecognition =
            (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (!SpeechRecognition) {
            alert("Voice search is not supported in this browser. Please type your search.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = "en-US";
        recognition.onstart = () => setIsListening(true);
        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);
        recognition.onresult = (event: any) => {
            const transcript = event.results[0]?.[0]?.transcript;
            if (transcript) {
                search.submit(transcript);
                setIsMobileMenuOpen(false);
            }
        };
        recognition.start();
    };

    return (
        <>
            <Suspense fallback={null}>
                <SearchQuerySync onQuery={search.syncFromUrl} />
            </Suspense>
            <header
                data-site-nav
                className="fixed top-3 md:top-4 inset-x-0 z-50 flex justify-center px-3 md:px-4 pointer-events-none"
            >
                <div
                    className={cn(
                        "glass-nav pointer-events-auto flex items-center gap-0.5 rounded-[20px] h-12 pl-1.5 pr-1 max-w-full",
                        isScrolled && "!bg-black/70"
                    )}
                >
                    {/* Brand mark */}
                    <Link
                        href="/"
                        className="flex items-center gap-2 h-10 pl-2 pr-2.5 rounded-2xl hover:bg-white/10 shrink-0"
                        aria-label="GedaTv home"
                    >
                        <Tv className="h-[18px] w-[18px] text-white" aria-hidden="true" />
                        <span className="text-[15px] font-semibold tracking-tight text-white lg:hidden xl:inline">GedaTv</span>
                    </Link>

                    {/* Desktop navigation links */}
                    <nav className="hidden lg:flex items-center gap-0.5">
                        {primaryLinks.map((link) => {
                            const active = isActivePath(pathname, link.href);
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    aria-current={active ? "page" : undefined}
                                    className={cn(
                                        "h-9 px-3 rounded-[14px] text-[13px] font-medium flex items-center",
                                        active ? "bg-white/15 text-white" : "text-white/80 hover:text-white hover:bg-white/10"
                                    )}
                                >
                                    {link.name}
                                </Link>
                            );
                        })}

                        <li className="relative list-none" ref={moreRef}>
                            <button
                                type="button"
                                onClick={() => setIsMoreOpen((v) => !v)}
                                aria-expanded={isMoreOpen}
                                className={cn(
                                    "h-9 px-3 rounded-[14px] text-[13px] font-medium flex items-center gap-1 text-white/80 hover:text-white hover:bg-white/10",
                                    isMoreOpen && "bg-white/10 text-white"
                                )}
                            >
                                More
                                <ChevronDown className={cn("h-3.5 w-3.5", isMoreOpen && "rotate-180")} />
                            </button>

                            {isMoreOpen && (
                                <div className="glass-nav absolute left-0 top-full mt-3 w-44 rounded-2xl bg-black/80 p-1.5 z-50">
                                    {secondaryLinks.map((link) => (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            className="block rounded-xl px-3 py-2 text-[13px] font-medium text-white/80 hover:bg-white/10 hover:text-white"
                                        >
                                            {link.name}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </li>
                    </nav>

                    <span className="hidden lg:block mx-1 h-5 w-px bg-white/15" aria-hidden="true" />

                    {/* Search: compact field that widens while in use */}
                    <form
                        onSubmit={handleSearchSubmit}
                        role="search"
                        className={cn(
                            "hidden md:flex items-center h-9 rounded-[14px] px-2.5 gap-2 hover:bg-white/10 focus-within:bg-white/10 overflow-hidden",
                            pathname === "/search" || searchQuery ? "w-52 bg-white/10" : "w-9 focus-within:w-52"
                        )}
                    >
                        <button type="submit" aria-label="Submit search" className="shrink-0 text-white/80 hover:text-white">
                            {search.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                            ) : (
                                <Search className="h-4 w-4" />
                            )}
                        </button>
                        <input
                            ref={desktopInputRef}
                            type="search"
                            enterKeyHint="search"
                            autoComplete="off"
                            aria-label="Search titles, anime, cast"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => search.onChange(e.target.value)}
                            onFocus={() => router.prefetch("/search")}
                            className="flex-1 min-w-0 bg-transparent border-none text-[13px] text-white placeholder:text-white/50 outline-none [&::-webkit-search-cancel-button]:hidden"
                        />
                        {searchQuery ? (
                            <button
                                type="button"
                                onClick={() => {
                                    search.onChange("");
                                    desktopInputRef.current?.focus();
                                }}
                                className="shrink-0 text-white/60 hover:text-white"
                                aria-label="Clear search"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleVoiceSearch}
                                className={cn("shrink-0 text-white/60 hover:text-white", isListening && "text-accent")}
                                title="Voice search"
                                aria-label="Voice search"
                            >
                                <Mic className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </form>

                    {/* Mobile search */}
                    <button
                        onClick={() => router.push("/search")}
                        className="md:hidden grid place-items-center h-9 w-9 rounded-[14px] text-white/80 hover:text-white hover:bg-white/10"
                        aria-label="Search"
                    >
                        <Search className="h-4 w-4" />
                    </button>

                    {/* Surprise me */}
                    <button
                        disabled={isPending}
                        onClick={() => startTransition(() => surpriseMe())}
                        className="grid place-items-center h-9 w-9 rounded-[14px] text-white/80 hover:text-white hover:bg-white/10"
                        title="Surprise me with a random title"
                        aria-label="Surprise me"
                    >
                        <Dices className={cn("h-4 w-4", isPending && "animate-spin")} />
                    </button>

                    {/* Profile switcher */}
                    <div className="relative" ref={profileRef}>
                        <button
                            onClick={() => setIsProfileOpen(v => !v)}
                            aria-expanded={isProfileOpen}
                            className={cn(
                                "grid place-items-center h-9 w-9 rounded-[14px] hover:bg-white/10",
                                isProfileOpen && "bg-white/10"
                            )}
                            title={`Active profile: ${activeProfile.name}`}
                            aria-label={`Profile: ${activeProfile.name}`}
                        >
                            <span className="text-[15px] leading-none select-none">{activeProfile.avatar}</span>
                        </button>

                        {isProfileOpen && (
                            <div className="glass-nav absolute right-0 top-full mt-3 w-56 rounded-2xl bg-black/85 p-1.5 z-50 space-y-0.5">
                                <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/50">
                                    Who is watching?
                                </div>
                                {profiles.map((p) => {
                                    const isCurrent = p.id === activeProfile.id;
                                    return (
                                        <button
                                            key={p.id}
                                            onClick={() => {
                                                lib.setActiveProfile(p.id);
                                                setIsProfileOpen(false);
                                            }}
                                            className={cn(
                                                "w-full flex items-center justify-between px-3 py-2 rounded-xl text-[13px] font-medium",
                                                isCurrent ? "bg-white/15 text-white" : "text-white/75 hover:bg-white/10 hover:text-white"
                                            )}
                                        >
                                            <span className="flex items-center gap-2">
                                                <span className="text-base">{p.avatar}</span>
                                                <span>{p.name}</span>
                                            </span>
                                            {isCurrent && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                                        </button>
                                    );
                                })}
                                <div className="border-t border-white/10 mt-1 pt-1">
                                    <Link
                                        href="/watchlist"
                                        onClick={() => setIsProfileOpen(false)}
                                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] font-medium text-white/75 hover:bg-white/10 hover:text-white"
                                    >
                                        <Heart className="w-3.5 h-3.5" />
                                        <span>My List</span>
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Theme toggle */}
                    <button
                        onClick={toggleTheme}
                        className="hidden sm:grid place-items-center h-9 w-9 rounded-[14px] text-white/80 hover:text-white hover:bg-white/10"
                        title={`Switch to ${currentTheme === "light" ? "dark" : "light"} mode`}
                        aria-label="Toggle theme"
                    >
                        {currentTheme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                    </button>

                    {/* Mobile menu */}
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="lg:hidden grid place-items-center h-9 w-9 rounded-[14px] text-white hover:bg-white/10"
                        aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
                    >
                        {isMobileMenuOpen ? <X className="h-[18px] w-[18px]" /> : <Menu className="h-[18px] w-[18px]" />}
                    </button>
                </div>
            </header>

            {/* Mobile Full Screen Menu Drawer */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/95 backdrop-blur-xl overflow-y-auto px-6 pt-24 pb-6 flex flex-col justify-between"
                >
                    <div className="space-y-4">
                        {/* Profile switcher inside mobile drawer */}
                        <div className="p-3.5 rounded-2xl bg-surface border border-line flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <span className="text-2xl">{activeProfile.avatar}</span>
                                <div>
                                    <div className="text-xs text-muted">Currently watching as</div>
                                    <div className="text-sm font-bold text-white">{activeProfile.name}</div>
                                </div>
                            </div>
                            <div className="flex gap-1">
                                {profiles.map((p) => (
                                    <button
                                        key={p.id}
                                        onClick={() => lib.setActiveProfile(p.id)}
                                        className={cn(
                                            "h-8 px-2.5 rounded-full text-xs font-semibold",
                                            p.id === activeProfile.id ? "bg-white text-black" : "bg-surface-2 text-muted"
                                        )}
                                    >
                                        {p.avatar} {p.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Mobile Navigation links */}
                        <ul className="space-y-1.5 pt-2">
                            {primaryLinks.map((link) => {
                                const active = isActivePath(pathname, link.href);
                                return (
                                    <li key={link.href}>
                                        <Link
                                            href={link.href}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className={cn(
                                                "flex items-center justify-between px-4 py-3 rounded-2xl text-base font-bold",
                                                active ? "bg-white/10 text-white" : "text-gray-300 hover:text-white hover:bg-surface-2"
                                            )}
                                        >
                                            <span className="flex items-center gap-2">
                                                <span>{link.name}</span>
                                            </span>
                                            {active && <span className="h-2 w-2 rounded-full bg-white" />}
                                        </Link>
                                    </li>
                                );
                            })}

                            {secondaryLinks.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="block px-4 py-2.5 rounded-2xl text-sm font-medium text-muted hover:text-white hover:bg-surface-2"
                                    >
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Mobile Drawer Footer */}
                    <div className="pt-6 border-t border-line text-xs text-muted flex items-center justify-between pb-20">
                        <span>GedaTv</span>
                        <div className="flex gap-3">
                            <Link href="/about" onClick={() => setIsMobileMenuOpen(false)}>About</Link>
                            <Link href="/privacy" onClick={() => setIsMobileMenuOpen(false)}>Privacy</Link>
                        </div>
                    </div>
                </div>
            )}

            {/* Mobile Bottom Tab Bar */}
            <nav
                data-site-nav
                data-tabbar
                aria-label="Bottom Navigation"
                className="lg:hidden fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-black/80 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]"
            >
                <ul className="grid grid-cols-5 h-14">
                    {tabLinks.map(({ name, href, icon: Icon }) => {
                        const active = isActivePath(pathname, href);
                        return (
                            <li key={href}>
                                <Link
                                    href={href}
                                    className={cn(
                                        "flex h-full flex-col items-center justify-center gap-1 text-[10px] font-medium",
                                        active ? "text-white font-semibold" : "text-white/55 hover:text-white"
                                    )}
                                >
                                    <Icon className="h-4 w-4" />
                                    <span>{name}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>
        </>
    );
}
