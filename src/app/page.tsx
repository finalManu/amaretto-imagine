import Image from "next/image";
import { db } from "~/server/db";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const images = await db.query.images.findMany({
    orderBy: (model, { desc }) => desc(model.id),
  });

  return (
    <main className="">
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
    </main>
  );
}
