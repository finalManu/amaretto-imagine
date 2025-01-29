import { SignedIn, SignedOut } from "@clerk/nextjs";
import Image from "next/image";
import { db } from "~/server/db";

export const dynamic = "force-dynamic";

async function Images() {
  const images = await db.query.images.findMany({
    orderBy: (model, { desc }) => desc(model.id),
  });
  return (
    <div className="flex flex-wrap gap-4">
      {images.map((image) => (
        <div key={image.id} className="relative h-48">
          <Image
            src={image.url}
            alt={`Image ${image.id}`}
            className="h-full w-auto"
            width={384}
            height={192}
            style={{ width: "auto" }}
            unoptimized // Skips Next.js's built-in image optimization - images won't be resized, optimized or served from Next.js's image optimization API. Useful when images are already optimized or served from an external CDN.
          />
          <div>{image.name}</div>
        </div>
      ))}
    </div>
  );
}

export default async function HomePage() {
  return (
    <main className="">
      <SignedOut>
        <div className="h-full w-full text-center text-2xl">
          Please sign in above
        </div>
      </SignedOut>
      <SignedIn>
        <Images />
      </SignedIn>
    </main>
  );
}
