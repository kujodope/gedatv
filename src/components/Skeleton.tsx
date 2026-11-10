import { cn } from "@/lib/utils";
import { ROW_CARD_WIDTH } from "@/lib/images";

interface SkeletonProps {
    className?: string;
}

export const Skeleton = ({ className }: SkeletonProps) => {
    return <div aria-hidden="true" className={cn("skeleton", className)} />;
};

// Same shape as a MovieCard (2:3 poster, title, meta line), so the real card
// replaces it without the layout moving
export const MovieCardSkeleton = () => {
    return (
        <div aria-hidden="true">
            <Skeleton className="aspect-[2/3] w-full rounded-2xl" />
            <Skeleton className="mt-2.5 h-3.5 w-4/5 rounded-full" />
            <Skeleton className="mt-2 h-2.5 w-1/2 rounded-full" />
        </div>
    );
};

// Placeholder for the responsive card grids (search, categories, studios)
export const CardGridSkeleton = ({ count = 10, label = "Loading" }: { count?: number; label?: string }) => {
    return (
        <div
            role="status"
            aria-label={label}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-3 gap-y-5 sm:gap-x-4 sm:gap-y-6"
        >
            {Array.from({ length: count }, (_, i) => (
                <MovieCardSkeleton key={i} />
            ))}
        </div>
    );
};

export const SectionSkeleton = () => {
    return (
        <div className="page-gutter space-y-6 py-6">
            <Skeleton className="h-8 w-56 rounded-md" />
            <CardGridSkeleton count={10} />
        </div>
    );
};

export const MovieRowSkeleton = () => {
    return (
        <div className="page-gutter" role="status" aria-label="Loading">
            <Skeleton className="h-6 w-48 mb-4 rounded-md" />
            <div className="flex gap-3 overflow-hidden pt-2 pb-4 -mt-2 -mb-4">
                {Array.from({ length: 8 }, (_, i) => (
                    <div key={i} className={ROW_CARD_WIDTH}>
                        <MovieCardSkeleton />
                    </div>
                ))}
            </div>
        </div>
    );
};

export const HeroSkeleton = () => {
    return (
        <div className="relative w-full h-[78svh] min-h-[520px] md:h-[88vh] md:min-h-[600px] max-h-[960px] bg-surface overflow-hidden" aria-hidden="true">
            <div className="skeleton absolute inset-0 rounded-none bg-surface-2/60" />
            <div className="absolute inset-0 scrim-hero" />
            <div className="absolute inset-x-0 bottom-16 md:bottom-28 page-gutter space-y-4 max-w-2xl">
                <Skeleton className="h-3 w-40 rounded-full" />
                <Skeleton className="h-14 md:h-20 w-3/4 rounded-xl" />
                <Skeleton className="h-4 w-32 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-full rounded-full" />
                    <Skeleton className="h-4 w-5/6 rounded-full" />
                </div>
                <div className="flex gap-3 pt-3">
                    <Skeleton className="h-12 w-32 rounded-full" />
                    <Skeleton className="h-12 w-36 rounded-full" />
                    <Skeleton className="h-12 w-12 rounded-full" />
                </div>
            </div>
        </div>
    );
};
