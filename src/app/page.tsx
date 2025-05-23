import { SignedIn, SignedOut } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { db } from "~/server/db";
import { getMyImages } from "~/server/queries";

// Forces Next.js to render the page dynamically on every request, bypassing static rendering and caching.
// Needed when we want real-time data updates, like showing the latest uploaded images.
//have it just in case now to be sure, but technically not needed right now
export const dynamic = "force-dynamic";

async function Images() {
  const images = await getMyImages();

  return (
    <div className="flex flex-wrap gap-x-4 gap-y-12 p-4">
      {images.map((image) => (
        <div key={image.id} className="relative h-48">
          <Link href={`/img/${image.id}`}>
            <Image
              src={image.url}
              alt={`Image ${image.id}`}
              className="h-full w-auto"
              width={384}
              height={192}
              style={{ width: "auto" }}
              unoptimized // Skips Next.js's built-in image optimization - images won't be resized, optimized or served from Next.js's image optimization API. Useful when images are already optimized or served from an external CDN.
            />
          </Link>
          <div className="mt-2 max-w-[200px] truncate text-sm font-medium">
            {image.name.replace(/\.png$/, "")}
          </div>
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
