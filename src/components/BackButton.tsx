"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { goBackOrHome } from "@/lib/navHistory";

export default function BackButton() {
    const router = useRouter();

    return (
        <button
            onClick={() => goBackOrHome(router)}
            className="fixed top-4 left-4 md:top-6 md:left-8 z-[60] btn btn-sm btn-ghost bg-black/45 group"
        >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
        </button>
    );
}
