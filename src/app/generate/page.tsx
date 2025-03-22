"use client";

import { ImageGenerator } from "../../components/ImageGenerator";

export default function GeneratePage() {
  return (
    <main className="container mx-auto py-8">
      <h1 className="mb-8 text-center text-3xl font-bold">Generate Images</h1>
      <ImageGenerator />
    </main>
  );
}
