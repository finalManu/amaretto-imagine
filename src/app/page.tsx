import { SignedIn, SignedOut } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { db } from "~/server/db";
import { getMyImages } from "~/server/queries";

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
          <div>{image.name.slice(0, 10)}</div>
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
