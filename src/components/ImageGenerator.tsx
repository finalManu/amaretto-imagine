"use client";

import { useState } from "react";
import {
  useImageGeneration,
  type ImageGenerationHook,
} from "../hooks/useImageGeneration";
import { ImageDisplay } from "./ImageDisplay";
import { PROVIDERS } from "~/lib/provider-config";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "~/components/ui/dropdown-menu";
import { Button } from "~/components/ui/button";

export function ImageGenerator() {
  const [prompt, setPrompt] = useState("");
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
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
      const newSelection = prev.includes(model)
        ? prev.filter((m) => m !== model)
        : [...prev, model];

      // Only close the dropdown if we've reached 4 models
      if (newSelection.length >= 4) {
        setIsDropdownOpen(false);
      }

      return newSelection;
    });
  };

  const handleDropdownOpenChange = (open: boolean) => {
    // If trying to open the dropdown, always allow it
    if (open) {
      setIsDropdownOpen(true);
      return;
    }

    // If trying to close and we have 4 models selected, allow it
    if (selectedModels.length >= 4) {
      setIsDropdownOpen(false);
      return;
    }

    // If it's a click on the trigger button (toggle), allow it
    const isTriggerClick =
      document.activeElement?.getAttribute("role") === "button";
    if (isTriggerClick) {
      setIsDropdownOpen(false);
      return;
    }

    // If it's a click outside (not on a checkbox item), allow it
    const isCheckboxClick =
      document.activeElement?.getAttribute("role") === "menuitemcheckbox";
    if (!isCheckboxClick) {
      setIsDropdownOpen(false);
      return;
    }

    // Otherwise, keep it open
    setIsDropdownOpen(true);
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

  const formatProgress = (progress: number) => {
    return Math.min(Math.round(progress * 100), 100);
  };

  const formatModelName = (model: string) => {
    return model.split("/")[1] ?? model;
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-4">
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="flex flex-col space-y-3">
          <label htmlFor="prompt" className="text-base font-semibold leading-7">
            Image Prompt
          </label>
          <input
            id="prompt"
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the image you want to generate..."
            className="w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground shadow-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring"
            disabled={Object.values(isLoading).some(Boolean)}
          />
        </div>

        <div className="flex flex-col space-y-3">
          <label className="text-base font-semibold leading-7">
            Model Selection
          </label>
          <DropdownMenu
            open={isDropdownOpen}
            onOpenChange={handleDropdownOpenChange}
          >
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start px-4 py-3 font-normal"
                disabled={Object.values(isLoading).some(Boolean)}
              >
                {selectedModels.length === 0
                  ? "Select up to 4 models"
                  : selectedModels.map(formatModelName).join(", ")}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-full min-w-[300px]">
              {PROVIDERS.replicate.models.map((model) => (
                <DropdownMenuCheckboxItem
                  key={model}
                  checked={selectedModels.includes(model)}
                  onCheckedChange={() => handleModelToggle(model)}
                  disabled={
                    !selectedModels.includes(model) &&
                    selectedModels.length >= 4
                  }
                  className="py-3 pl-8 pr-2"
                >
                  {formatModelName(model)}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Button
          type="submit"
          className="w-full py-6 text-base"
          disabled={Object.values(isLoading).some(Boolean)}
        >
          Imagine
        </Button>
      </form>

      {error && (
        <div className="rounded-lg bg-destructive/15 p-4">
          <p className="text-sm font-medium leading-none text-destructive">
            {error.message || "An error occurred"}
          </p>
        </div>
      )}

      {Object.entries(progress).map(([model, progress]) => {
        // Don't show progress bar if image is loaded (progress is 100%)
        if (formatProgress(progress) === 100) return null;

        return (
          <div key={model} className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium leading-none">
                {formatModelName(model)}
              </span>
              <span className="text-sm text-muted-foreground">
                {formatProgress(progress)}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${formatProgress(progress)}%` }}
              />
            </div>
          </div>
        );
      })}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {images.map((imageData) => (
          <div key={imageData.model} className="space-y-3">
            <h3 className="text-base font-medium leading-7">
              {formatModelName(imageData.model)}
            </h3>
            <ImageDisplay
              image={imageData.image}
              elapsedTime={imageData.elapsedTime}
            />
          </div>
        ))}
      </div>

      {images.length > 0 && (
        <div className="rounded-lg border border-border bg-muted/50 p-4">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">Prompt:</span> {prompt}
          </p>
        </div>
      )}
    </div>
  );
}
