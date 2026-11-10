// Image/API constants safe to import from client components
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p";

export const TMDB_CONFIG = {
    baseUrl: "https://api.themoviedb.org/3",
    imageBase: IMAGE_BASE_URL,
    posterSizes: {
        small: `${IMAGE_BASE_URL}/w185`,
        medium: `${IMAGE_BASE_URL}/w342`,
        large: `${IMAGE_BASE_URL}/w780`,
    },
    backdropSizes: {
        small: `${IMAGE_BASE_URL}/w300`,
        medium: `${IMAGE_BASE_URL}/w780`,
        large: `${IMAGE_BASE_URL}/w1280`,
    },
};
