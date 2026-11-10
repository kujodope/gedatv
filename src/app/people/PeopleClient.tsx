"use client";

import PageHeader from "@/components/PageHeader";
import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Search, User, Star } from "lucide-react";
import { TMDB_CONFIG } from "@/lib/tmdbConfig";

interface KnownForMedia {
    id: number;
    title?: string;
    name?: string;
    media_type: "movie" | "tv";
    poster_path?: string;
}

interface Person {
    id: number;
    name: string;
    profile_path: string;
    known_for_department: string;
    popularity: number;
    known_for: KnownForMedia[];
}

interface PeopleClientProps {
    initialPeople: Person[];
}

export default function PeopleClient({ initialPeople }: PeopleClientProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [activeDepartment, setActiveDepartment] = useState<"All" | "Acting" | "Directing" | "Production" | "Writing">("All");

    // Extract all unique departments to make filters dynamic, with fallbacks
    const departments = useMemo(() => {
        const set = new Set<string>(["All"]);
        initialPeople.forEach(p => {
            if (p.known_for_department) {
                set.add(p.known_for_department);
            }
        });
        return Array.from(set);
    }, [initialPeople]);

    // Search and filter logic
    const filteredPeople = useMemo(() => {
        return initialPeople.filter(person => {
            const matchesSearch = person.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                person.known_for.some(m => (m.title || m.name || "").toLowerCase().includes(searchQuery.toLowerCase()));
            
            const matchesDept = activeDepartment === "All" || person.known_for_department === activeDepartment;

            return matchesSearch && matchesDept;
        });
    }, [initialPeople, searchQuery, activeDepartment]);



    return (
        <div className="w-full">
            <PageHeader
                eyebrow="Cast & creators"
                title="People"
                description="Explore the careers of today's most popular actors, directors and writers."
            />

            {/* Filters and Search Bar */}
            <div className="flex flex-col md:flex-row gap-6 items-center justify-between mb-10">
                {/* Department Toggle Tabs */}
                <div className="flex gap-1 p-1.5 rounded-2xl bg-white/5 border border-white/5 overflow-x-auto max-w-full scrollbar-hide">
                    {["All", "Acting", "Directing", "Production", "Writing"].map((dept) => {
                        const isSelected = activeDepartment === dept;
                        return (
                            <button
                                key={dept}
                                onClick={() => setActiveDepartment(dept as any)}
                                className={`px-5 py-2.5 rounded-xl text-xs md:text-sm font-bold cursor-pointer whitespace-nowrap ${
                                    isSelected
                                        ? "bg-white text-black font-extrabold shadow-md shadow-white/10"
                                        : "text-gray-400 hover:text-white hover:bg-white/5"
                                }`}
                            >
                                {dept === "All" ? "All Stars" : dept}
                            </button>
                        );
                    })}
                </div>

                {/* Realtime Search Input */}
                <div className="relative w-full md:max-w-md bg-white/5 border border-white/10 rounded-full px-5 py-3.5 focus-within:border-white/40 focus-within:ring-1 focus-within:ring-white/20">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search actors or directors..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-transparent border-none w-full pl-6 text-sm text-white placeholder-gray-500 outline-none"
                    />
                </div>
            </div>

            {/* People Grid */}
            <>
                <div
                    key={`${activeDepartment}-${searchQuery}`}
                    className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6"
                >
                    {filteredPeople.length > 0 ? (
                        filteredPeople.map((person) => {
                            const avatarUrl = person.profile_path
                                ? `${TMDB_CONFIG.posterSizes.medium}${person.profile_path}`
                                : null;

                            return (
                                <div
                                    key={person.id}
                                    className="group relative flex flex-col items-center"
                                >
                                    <Link href={`/person/${person.id}`} className="w-full flex flex-col items-center text-center space-y-4">
                                        {/* Avatar Frame with hover zoom & glow */}
                                        <div className="relative w-40 h-40 md:w-44 md:h-44 rounded-full overflow-hidden border border-white/10 shadow-lg group-hover:border-white/30 group-hover:shadow-2xl">
                                            {avatarUrl ? (
                                                <img
                                                    src={avatarUrl}
                                                    alt={person.name}
                                                    loading="lazy"
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-zinc-900 flex items-center justify-center text-gray-600">
                                                    <User className="h-16 w-16" />
                                                </div>
                                            )}

                                            {/* Top Overlay shimmer */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100" />
                                            
                                            {/* Popularity Badge on hover */}
                                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/80 border border-white/10 text-[10px] font-semibold text-white tracking-wide opacity-0 group-hover:opacity-100 transform translate-y-2">
                                                <Star className="h-2.5 w-2.5 text-yellow-400 fill-yellow-400" />
                                                <span>{Math.round(person.popularity)}</span>
                                            </div>
                                        </div>

                                        {/* Meta names */}
                                        <div className="space-y-1 w-full px-2">
                                            <h3 className="text-base font-bold text-white group-hover:text-white truncate">
                                                {person.name}
                                            </h3>
                                            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
                                                {person.known_for_department || "Staff"}
                                            </p>
                                        </div>
                                    </Link>

                                    {/* Known For mini tray */}
                                    <div className="w-full text-center mt-2.5 px-3 min-h-[36px]">
                                        <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">
                                            {person.known_for && person.known_for.length > 0 ? (
                                                person.known_for.map((m, idx) => (
                                                    <span key={m.id}>
                                                        {m.title || m.name}
                                                        {idx < person.known_for.length - 1 ? " • " : ""}
                                                    </span>
                                                ))
                                            ) : (
                                                <span>Works behind scenes</span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="col-span-full py-20 flex flex-col items-center justify-center text-center space-y-4">
                            <div className="p-4 rounded-full bg-white/5 border border-white/10 text-gray-500">
                                <Search className="h-10 w-10" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-lg font-bold text-white">No film stars match your search</h3>
                                <p className="text-sm text-gray-400">Try verifying the spelling or picking a different department filter.</p>
                            </div>
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery("")}
                                    className="px-5 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold tracking-wide border border-white/5 cursor-pointer"
                                >
                                    Clear Search Query
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </>
        </div>
    );
}
