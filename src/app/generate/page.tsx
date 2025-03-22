"use client";

import { ImageGenerator } from "../../components/ImageGenerator";

export default function GeneratePage() {
  return (
    <main className="container mx-auto">
      <h1 className="mx-auto max-w-6xl p-4 text-3xl font-semibold tracking-tight">
        Imagine
      </h1>
      <ImageGenerator />
    </main>
  );
}
