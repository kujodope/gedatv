import { SectionSkeleton } from "@/components/Skeleton";

export default function CategoriesLoading() {
    return (
        <main className="min-h-screen page-top" aria-busy="true">
            <SectionSkeleton />
        </main>
    );
}
