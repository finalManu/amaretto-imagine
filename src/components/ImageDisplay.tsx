import { useState } from "react";

interface ImageDisplayProps {
  image: string | null;
  elapsedTime?: number | null;
}

export function ImageDisplay({ image, elapsedTime }: ImageDisplayProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

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

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
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
        {elapsedTime && (
          <span className="rounded-md bg-black/70 px-2 py-1 text-xs font-medium text-white/90 backdrop-blur-sm">
            {(elapsedTime / 1000).toFixed(1)}s
          </span>
        )}

        <button
          onClick={handleDownload}
          className="rounded-md bg-black/70 px-2 py-1 text-xs font-medium text-white/90 backdrop-blur-sm hover:bg-black/90"
        >
          Download
        </button>
      </div>
    </div>
  );
}
