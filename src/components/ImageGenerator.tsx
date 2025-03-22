"use client";

import { useState } from "react";
import {
  useImageGeneration,
  type ImageGenerationHook,
} from "../hooks/useImageGeneration";
import { ImageDisplay } from "./ImageDisplay";
import { PROVIDERS } from "~/lib/provider-config";

export function ImageGenerator() {
  const [prompt, setPrompt] = useState("");
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const {
    images,
    error,
    isLoading,
    progress,
    generateImages,
    reset,
  }: ImageGenerationHook = useImageGeneration();

  const handleModelToggle = (model: string) => {
    setSelectedModels((prev) => {
      if (prev.includes(model)) {
        return prev.filter((m) => m !== model);
      }
      if (prev.length >= 4) {
        return prev;
      }
      return [...prev, model];
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted with prompt:", prompt);
    if (prompt.trim() && selectedModels.length > 0) {
      await generateImages(prompt, selectedModels);
    } else {
      console.error("Empty prompt or no models selected");
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col space-y-2">
          <label htmlFor="prompt" className="text-sm font-medium text-gray-700">
            Image Prompt
          </label>
          <input
            id="prompt"
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the image you want to generate..."
            className="w-full rounded-lg border border-gray-300 p-3 text-black shadow-sm placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={Object.values(isLoading).some(Boolean)}
          />
          <p className="text-xs text-gray-500">
            Try to be specific about what you want to see in the image
          </p>
        </div>

        <div className="flex flex-col space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Select Models (up to 4)
          </label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {PROVIDERS.replicate.models.map((model) => (
              <button
                key={model}
                type="button"
                onClick={() => handleModelToggle(model)}
                disabled={Object.values(isLoading).some(Boolean)}
                className={`rounded-lg border p-2 text-sm transition-colors ${
                  selectedModels.includes(model)
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-300 hover:border-gray-400"
                } ${
                  !selectedModels.includes(model) && selectedModels.length >= 4
                    ? "cursor-not-allowed opacity-50"
                    : ""
                }`}
              >
                {model}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500">
            Select up to 4 models to generate images with
          </p>
        </div>

        <button
          type="submit"
          disabled={
            Object.values(isLoading).some(Boolean) ||
            !prompt.trim() ||
            selectedModels.length === 0
          }
          className="w-full rounded-lg bg-blue-600 p-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {Object.values(isLoading).some(Boolean) ? (
            <span className="flex items-center justify-center">
              <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Generating...
            </span>
          ) : (
            "Generate Images"
          )}
        </button>
      </form>

      {error && (
        <div className="rounded-lg bg-red-50 p-4">
          <p className="text-red-500">{error.message}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {selectedModels.map((model) => (
          <div
            key={model}
            className="overflow-hidden rounded-lg border border-gray-200 shadow-md"
          >
            <div className="border-b p-3">
              <h3 className="text-sm font-medium">{model}</h3>
              {isLoading[model] && (
                <div className="mt-2">
                  <div className="mb-1 flex justify-between text-xs">
                    <span>Generating...</span>
                    <span>{Math.round(progress[model] ?? 0)}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full bg-blue-600 transition-all duration-300"
                      style={{ width: `${progress[model]}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
            {images.find((img) => img.model === model) && (
              <ImageDisplay
                image={images.find((img) => img.model === model)?.image ?? null}
                elapsedTime={
                  images.find((img) => img.model === model)?.elapsedTime ?? null
                }
              />
            )}
          </div>
        ))}
      </div>

      {images.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={reset}
            className="rounded-md bg-gray-100 px-3 py-1 text-sm text-gray-700 hover:bg-gray-200"
          >
            Reset
          </button>
        </div>
      )}
    </div>
  );
}
