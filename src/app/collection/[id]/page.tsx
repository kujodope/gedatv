import { tmdb, TMDB_CONFIG, isNotFound } from "@/lib/tmdb";
import { notFound } from "next/navigation";
import MovieCard from "@/components/MovieCard";
import { heroSrcSet } from "@/lib/images";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const collection = await tmdb.getCollection(id);
    if (!collection) return { title: "Collection" };

    return {
        title: `${collection.name}`,
        description: collection.overview,
        openGraph: {
            title: `${collection.name} | GedaTv`,
            description: collection.overview,
            images: [
                {
                    url: `https://image.tmdb.org/t/p/w1280${collection.backdrop_path}`,
                    width: 1280,
                    height: 720,
                    alt: collection.name
                },
            ],
        },
    };
}

// Rendered on first visit, then served from the CDN and refreshed hourly
export const revalidate = 3600;

export async function generateStaticParams() {
    return [];
}

export default async function CollectionPage({ 
    params 
}: { 
    params: Promise<{ id: string }> 
}) {
    const resolvedParams = await params;
    const collectionId = resolvedParams.id;

    const collection = await tmdb.getCollection(collectionId);

    // A title that genuinely doesn't exist gets a real 404
    if (isNotFound(collection)) notFound();
    if (!collection?.id) {
        // Errors are never cached, so a temporary TMDB failure can't stick on the CDN
        throw new Error(`Could not load collection ${collectionId}`);
    }

    return (
        <main className="min-h-screen bg-black pb-20 overflow-x-hidden">
            
            {/* Header / Hero */}
            <div className="relative h-[60vh] md:h-[70vh] w-full mb-12">
                <div className="absolute inset-0">
                    <img
                        src={`${TMDB_CONFIG.backdropSizes.large}${collection.backdrop_path}`}
                        srcSet={collection.backdrop_path ? heroSrcSet(collection.backdrop_path) : undefined}
                        sizes="100vw"
                        fetchPriority="high"
                        decoding="async"
                        className="w-full h-full object-cover brightness-50"
                        alt={collection.name}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                </div>
                
                <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 space-y-4 max-w-6xl">
                    <span className="text-accent text-xs font-black uppercase tracking-[0.4em]">Movie Collection</span>
                    <h1 className="text-4xl md:text-7xl font-black text-white leading-tight">
                        {collection.name}
                    </h1>
                    {collection.overview && (
                        <p className="text-gray-300 text-sm md:text-lg max-w-3xl line-clamp-3 md:line-clamp-none leading-relaxed">
                            {collection.overview}
                        </p>
                    )}
                </div>
            </div>

            {/* Collection Items */}
            <div className="px-4 sm:px-8 md:px-12">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-1.5 h-8 bg-accent rounded-full" />
                    <h2 className="text-2xl md:text-3xl font-bold text-white">
                        Included Movies
                        <span className="ml-3 text-gray-500 font-medium text-lg">({collection.parts?.length || 0})</span>
                    </h2>
                </div>

                {collection.parts && collection.parts.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-3 gap-y-5 sm:gap-x-4 sm:gap-y-6">
                        {collection.parts.map((movie: any) => (
                            <MovieCard key={movie.id} movie={{ ...movie, media_type: 'movie' }} isFluid={true} />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                        <p className="text-xl">No movies found in this collection.</p>
                    </div>
                )}
            </div>
        </main>
    );
}
