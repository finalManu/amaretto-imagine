import { useState } from "react";

// Define types directly in this file to avoid import issues
interface GeneratedImage {
  image: string | null;
  model: string;
  elapsedTime: number | null;
}

interface ImageError {
  message: string;
  model?: string;
}

interface ApiResponse {
  image?: string;
  error?: string;
}

type LoadingState = Record<string, boolean>;
type ProgressState = Record<string, number>;

export interface ImageGenerationHook {
  images: GeneratedImage[];
  error: ImageError | null;
  isLoading: LoadingState;
  progress: ProgressState;
  generateImages: (prompt: string, models: string[]) => Promise<void>;
  reset: () => void;
}

export function useImageGeneration(): ImageGenerationHook {
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [error, setError] = useState<ImageError | null>(null);
  const [isLoading, setIsLoading] = useState<LoadingState>({});
  const [progress, setProgress] = useState<ProgressState>({});

  const generateImages = async (
    prompt: string,
    models: string[],
  ): Promise<void> => {
    if (!prompt.trim()) {
      setError({ message: "Please enter a prompt" });
      return;
    }

    if (models.length === 0) {
      setError({ message: "Please select at least one model" });
      return;
    }

    // Reset states
    setError(null);
    setImages([]);

    // Initialize loading and progress states for each model
    const newLoadingState = models.reduce(
      (acc, model) => ({ ...acc, [model]: true }),
      {},
    );
    const newProgressState = models.reduce(
      (acc, model) => ({ ...acc, [model]: 0 }),
      {},
    );
    setIsLoading(newLoadingState);
    setProgress(newProgressState);

    try {
      // Create progress intervals for each model
      const progressIntervals = models.map((model) => {
        return setInterval(() => {
          setProgress((prev) => ({
            ...prev,
            [model]: Math.min(
              (prev[model] ?? 0) + (90 - (prev[model] ?? 0)) * 0.1,
              90,
            ),
          }));
        }, 500);
      });

      // Generate images concurrently
      const results = await Promise.all(
        models.map(async (model) => {
          const startTime = Date.now();
          try {
            const response = await fetch("/api/generate-images", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
              },
              body: JSON.stringify({ prompt: prompt.trim(), model }),
            });

            if (response.status === 429) {
              const data = (await response.json()) as ApiResponse;
              throw new Error(
                data.error ?? "Rate limit exceeded. Please try again later.",
              );
            }

            if (!response.ok) {
              const errorData = (await response.json()) as ApiResponse;
              throw new Error(
                errorData.error ?? `Server error: ${response.status}`,
              );
            }

            const data = (await response.json()) as ApiResponse;
            if (!data.image) {
              throw new Error("No image data received from the server");
            }

            return {
              image: data.image,
              model,
              elapsedTime: Date.now() - startTime,
            };
          } catch (error) {
            return {
              error,
              model,
            };
          }
        }),
      );

      // Clear all progress intervals
      progressIntervals.forEach((interval) => clearInterval(interval));

      // Process results
      const successfulResults: GeneratedImage[] = [];
      const errors: string[] = [];

      results.forEach((result) => {
        if ("error" in result) {
          errors.push(`${result.model}: ${(result.error as Error).message}`);
        } else {
          successfulResults.push(result as GeneratedImage);
          setProgress((prev) => ({ ...prev, [result.model]: 100 }));
        }
      });

      if (errors.length > 0) {
        setError({ message: errors.join("; ") });
      }

      setImages(successfulResults);
    } catch (err) {
      console.error("Error in image generation:", err);
      setError({
        message:
          err instanceof Error ? err.message : "An unexpected error occurred",
      });
      setProgress({});
    } finally {
      setIsLoading({});
    }
  };

  const reset = (): void => {
    setImages([]);
    setError(null);
    setIsLoading({});
    setProgress({});
  };

  return {
    images,
    error,
    isLoading,
    progress,
    generateImages,
    reset,
  };
}
