import { useState } from "react";
import { useUploadThing } from "~/utils/uploadthing";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

interface ImageDisplayProps {
  image: string | null;
  elapsedTime?: number | null;
  prompt?: string;
  model?: string;
  onSaveComplete?: () => void;
}

export function ImageDisplay({
  image,
  elapsedTime,
  prompt,
  model,
  onSaveComplete,
}: ImageDisplayProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaveDialogOpen, setSaveDialogOpen] = useState(false);
  const [customName, setCustomName] = useState("");
  const { startUpload } = useUploadThing("imageUploader");

  if (!image) return null;

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = `data:image/png;base64,${image}`;
    const date = new Date();
    const formattedDate = date.toLocaleDateString().replace(/\//g, "-");
    const formattedTime = date.toLocaleTimeString().replace(/:/g, "-");
    link.download = `generated-image-${formattedDate}-${formattedTime}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShowSaveDialog = () => {
    // Generate a default name based on the model or current date
    const defaultName = model
      ? `${model.split("/").pop() ?? model} image`
      : `Image ${new Date().toLocaleDateString()}`;
    setCustomName(defaultName);
    setSaveDialogOpen(true);
  };

  const handleSaveToGallery = async () => {
    try {
      setIsSaving(true);
      setSaveDialogOpen(false);

      // Convert base64 to blob
      const response = await fetch(`data:image/png;base64,${image}`);
      const blob = await response.blob();

      // Generate timestamp for correlation
      const timestamp = Date.now().toString();
      console.log("Generated timestamp for image:", timestamp);

      // Store prompt in temporary API if available
      let promptStored = false;
      if (prompt) {
        // Implement retry logic for the prompt storage
        const maxRetries = 3;
        for (let i = 0; i < maxRetries && !promptStored; i++) {
          try {
            // Add a delay between retries
            if (i > 0) {
              await new Promise((resolve) => setTimeout(resolve, 1000 * i));
            }

            console.log(
              `Sending prompt to API (attempt ${i + 1}/${maxRetries})`,
              {
                promptLength: prompt.length,
                timestamp,
              },
            );

            const promptResponse = await fetch("/api/prompt-storage", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                prompt,
                timestamp,
                customName: customName.trim() || undefined, // Only send if not empty
              }),
            });

            if (promptResponse.ok) {
              interface PromptResponse {
                success: boolean;
                message?: string;
                error?: string;
              }

              const result = (await promptResponse.json()) as PromptResponse;
              if (result.success) {
                promptStored = true;
                console.log("Prompt stored successfully");
              } else {
                console.warn("Failed to store prompt:", result.error);
              }
            } else {
              console.warn(
                `Prompt storage failed with status: ${promptResponse.status}`,
              );
            }
          } catch (error) {
            console.error(
              `Error storing prompt (attempt ${i + 1}/${maxRetries}):`,
              error,
            );
          }
        }

        if (!promptStored) {
          // Show warning to user but continue with upload
          toast.warning(
            "Couldn't store image prompt, proceeding with upload anyway",
          );
        }
      }

      // Create a File object with metadata in filename
      // Ensure the timestamp is the last part of the name before the extension
      const modelName = model ?? "ai";
      // Clean up model name to avoid special characters that might cause issues
      const safeModelName = modelName.replace(/[\/\\:*?"<>|]/g, "-");

      // Include metadata in the filename for backend processing
      // The actual display name will be the user's custom name from the dialog
      const filename = `generated-${safeModelName}-${timestamp}.png`;
      console.log(
        "Creating file with name:",
        filename,
        "Display name:",
        customName,
      );

      const file = new File([blob], filename, { type: "image/png" });

      // Upload using UploadThing
      await startUpload([file]);

      toast.success("Image saved to gallery!");
      onSaveComplete?.();
    } catch (error) {
      console.error("Failed to save image:", error);
      toast.error("Failed to save image to gallery");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <>
      <div className="group relative">
        <div
          className={`relative ${isFullscreen ? "fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" : ""}`}
        >
          <img
            src={`data:image/png;base64,${image}`}
            alt="Generated image"
            className={`${isFullscreen ? "max-h-[90vh] max-w-[90vw] object-contain" : "h-full w-full rounded-lg object-cover"}`}
            onClick={toggleFullscreen}
          />

          {isFullscreen && (
            <button
              onClick={toggleFullscreen}
              className="absolute right-4 top-4 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          )}
        </div>

        {/* Controls */}
        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between bg-gradient-to-t from-black/50 to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
          <div className="flex items-center gap-2">
            {elapsedTime && (
              <span className="rounded-md bg-black/70 px-2 py-1 text-xs font-medium text-white/90 backdrop-blur-sm">
                {(elapsedTime / 1000).toFixed(1)}s
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {prompt && model && (
              <button
                onClick={handleShowSaveDialog}
                disabled={isSaving}
                className="rounded-md bg-black/70 px-2 py-1 text-xs font-medium text-white/90 backdrop-blur-sm hover:bg-black/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save to Gallery"}
              </button>
            )}
            <button
              onClick={handleDownload}
              className="rounded-md bg-black/70 px-2 py-1 text-xs font-medium text-white/90 backdrop-blur-sm hover:bg-black/90"
            >
              Download
            </button>
          </div>
        </div>
      </div>

      {/* Save Dialog */}
      <Dialog open={isSaveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Image to Gallery</DialogTitle>
            <DialogDescription>
              Give your image a name to help you find it later
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="mb-4 aspect-video overflow-hidden rounded-md bg-black/10">
              <img
                src={`data:image/png;base64,${image}`}
                alt="Preview"
                className="h-full w-full object-contain"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="imageName" className="text-sm font-medium">
                Image Name
              </label>
              <Input
                id="imageName"
                value={customName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setCustomName(e.target.value)
                }
                placeholder="Enter a name for your image"
                className="w-full"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveToGallery} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Image"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
