"use client";

import { usePathname } from "next/navigation";
import React, { useEffect } from "react";
import { noteRouteChange } from "@/lib/navHistory";

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    noteRouteChange();
  }, [pathname]);

  // Records route changes for the Back button; renders the page as is
  return <>{children}</>;
}
