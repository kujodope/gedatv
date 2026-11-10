import React from 'react';
import Link from 'next/link';
import { Tv } from 'lucide-react';

const browseLinks = [
    { name: "Movies", href: "/movies" },
    { name: "TV Shows", href: "/tv" },
    { name: "Categories", href: "/categories" },
    { name: "Awards", href: "/awards" },
];

const exploreLinks = [
    { name: "People", href: "/people" },
    { name: "Studios", href: "/companies" },
    { name: "My List", href: "/watchlist" },
    { name: "Search", href: "/search" },
];

const infoLinks = [
    { name: "Home", href: "/" },
    { name: "About", href: "/about" },
    { name: "Privacy", href: "/privacy" },
    { name: "Terms", href: "/terms" },
];

const Footer = () => {
    return (
        <footer className="relative mt-16 border-t border-white/10 bg-black">
            <div className="page-gutter py-12 md:py-16">
                <div className="grid grid-cols-2 gap-10 md:grid-cols-12">
                    <div className="col-span-2 md:col-span-5 space-y-4">
                        <Link href="/" className="inline-flex items-center gap-2" aria-label="GedaTv home">
                            <Tv className="h-5 w-5 text-white" aria-hidden="true" />
                            <span className="text-[18px] font-semibold tracking-tight text-white">GedaTv</span>
                        </Link>
                        <p className="max-w-sm text-sm leading-relaxed text-muted">
                            Stream movies and series. Discover what to watch next, keep a list, and pick up where you left off.
                        </p>
                    </div>

                    <FooterColumn title="Browse" links={browseLinks} />
                    <FooterColumn title="Explore" links={exploreLinks} />
                    <FooterColumn title="GedaTv" links={infoLinks} />
                </div>

                <div className="mt-12 flex flex-col-reverse gap-4 border-t border-line pt-6 text-xs text-subtle md:flex-row md:items-center md:justify-between">
                    <p className="max-w-xl leading-relaxed">
                        GedaTv does not host any content on our servers. Metadata and artwork are provided by TMDB; this product is not endorsed or certified by TMDB.
                    </p>
                    <p className="text-gray-400">© GedaTv</p>
                </div>
            </div>
        </footer>
    );
};

function FooterColumn({ title, links }: { title: string; links: { name: string; href: string }[] }) {
    return (
        <nav aria-label={title} className="md:col-span-2 md:col-start-auto">
            <h2 className="eyebrow mb-4 font-sans tracking-[0.18em]">{title}</h2>
            <ul className="space-y-2.5">
                {links.map((link) => (
                    <li key={link.href}>
                        <Link href={link.href} className="text-sm text-gray-300 hover:text-white">
                            {link.name}
                        </Link>
                    </li>
                ))}
            </ul>
        </nav>
    );
}

export default Footer;
