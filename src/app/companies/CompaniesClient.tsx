"use client";

import PageHeader from "@/components/PageHeader";
import React from "react";
import Link from "next/link";
import { Building2, MapPin, Globe, ArrowRight, Film } from "lucide-react";
import { TMDB_CONFIG } from "@/lib/tmdbConfig";

interface Company {
    id: number;
    name: string;
    logo_path: string | null;
    headquarters: string;
    homepage: string;
    origin_country: string;
}

interface CompaniesClientProps {
    initialCompanies: Company[];
}

export default function CompaniesClient({ initialCompanies }: CompaniesClientProps) {
    return (
        <div className="w-full">
            <PageHeader
                eyebrow="Production studios"
                title="Studios"
                description="Browse film and TV catalogs from the world's most iconic production companies."
            />


            {/* Companies Grid */}
            <>
                <div
                    key="companies-grid"
                    className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
                >
                    {initialCompanies.length > 0 ? (
                        initialCompanies.map((company) => {
                            const logoUrl = company.logo_path
                                ? `${TMDB_CONFIG.imageBase}/w185${company.logo_path}` // 80px tile
                                : null;

                            return (
                                <div
                                    key={company.id}
                                    className="group relative flex flex-col bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-white/15 rounded-3xl p-6 shadow-xl hover:shadow-2xl overflow-hidden"
                                >
                                    {/* Abstract background tint on hover */}
                                    <div className="absolute -right-16 -bottom-16 w-36 h-36 rounded-full bg-white/[0.01] group-hover:bg-accent/[0.02] blur-2xl" />

                                    <div className="flex flex-col h-full justify-between space-y-6">
                                        <div className="space-y-4">
                                            {/* Logo Container */}
                                            <div className="w-20 h-20 bg-white/90 p-3 rounded-2xl flex items-center justify-center shadow-lg border border-white/10">
                                                {logoUrl ? (
                                                    <img
                                                        src={logoUrl}
                                                        alt={company.name}
                                                        loading="lazy"
                                                        decoding="async"
                                                        className="max-w-full max-h-full object-contain filter drop-shadow-sm"
                                                    />
                                                ) : (
                                                    <Building2 className="h-10 w-10 text-gray-400" />
                                                )}
                                            </div>

                                            {/* Meta Names */}
                                            <div className="space-y-1.5">
                                                <h3 className="text-xl font-black text-white leading-tight group-hover:text-accent">
                                                    {company.name}
                                                </h3>
                                                
                                                <div className="flex flex-col gap-1 text-xs text-gray-400 font-medium">
                                                    {company.headquarters && (
                                                        <div className="flex items-center gap-1.5 truncate">
                                                            <MapPin className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                                                            <span className="truncate">{company.headquarters}</span>
                                                        </div>
                                                    )}
                                                    {company.origin_country && (
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-[9px] uppercase font-bold text-gray-500 bg-white/5 px-1.5 py-0.5 rounded-md border border-white/5">Country:</span>
                                                            <span className="font-bold text-gray-300">{company.origin_country}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action buttons & layout link */}
                                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                            {company.homepage ? (
                                                <a
                                                    href={company.homepage}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-accent font-semibold"
                                                    id={`studio-website-link-${company.id}`}
                                                >
                                                    <Globe className="h-3.5 w-3.5" />
                                                    <span>Website</span>
                                                </a>
                                            ) : (
                                                <div />
                                            )}

                                            <Link
                                                href={`/company/${company.id}`}
                                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/5 hover:bg-accent text-white hover:text-black text-xs font-bold tracking-wide border border-white/10 hover:border-transparent group/btn"
                                                id={`studio-explore-btn-${company.id}`}
                                            >
                                                <span>Explore</span>
                                                <ArrowRight className="h-3.5 w-3.5" />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="col-span-full py-20 flex flex-col items-center justify-center text-center space-y-4">
                            <div className="p-4 rounded-full bg-white/5 border border-white/10 text-gray-500">
                                <Film className="h-10 w-10" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-lg font-bold text-white">No production studios available</h3>
                                <p className="text-sm text-gray-400">Please check back later.</p>
                            </div>
                        </div>
                    )}
                </div>
            </>
        </div>
    );
}
