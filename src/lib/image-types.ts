export interface GeneratedImage {
  image: string | null;
}

export interface ImageError {
  message: string;
}

export interface ApiResponse {
  image?: string;
  error?: string;
}

export interface ImageGenerationResponse {
  image: string;
  error?: string;
}
