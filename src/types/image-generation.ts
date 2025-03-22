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

export interface ImageGenerationHook {
  image: GeneratedImage | null;
  error: ImageError | null;
  isLoading: boolean;
  elapsedTime: number | null;
  progress: number;
  generateImage: (prompt: string) => Promise<void>;
  reset: () => void;
}
