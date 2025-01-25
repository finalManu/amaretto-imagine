import Image from "next/image";
import Link from "next/link";

const mockUrls = [
  "https://4grk8c4nb6.ufs.sh/f/hTMofYr9TDJnnkylAf3QXSabjqIUyNRpHJ0mvhVunsiPt93B",
  "https://4grk8c4nb6.ufs.sh/f/hTMofYr9TDJniDPG0PJ5No8mvt0KDTzyUc1aCfAW9wgpJPdY",
  "https://4grk8c4nb6.ufs.sh/f/hTMofYr9TDJnAz0J7a6fR1xtBLXiaT3vUhVzF8K0oCGQl6E9",
  "https://4grk8c4nb6.ufs.sh/f/hTMofYr9TDJnpQI7BHG9bzIEUmFHDQekOuPg6vK2T0j1A3No",
];

const mockImages = mockUrls.map((url, index) => ({
  id: index + 1,
  url,
}));

export default function HomePage() {
  return (
    <main className="">
      <div className="flex flex-wrap gap-4">
        {mockImages.map((image) => (
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
          </div>
        ))}
      </div>
    </main>
  );
}
