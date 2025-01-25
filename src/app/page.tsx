import Image from "next/image";
import Link from "next/link";

const mockUrls = [
  "https://4grk8c4nb6.ufs.sh/f/hTMofYr9TDJnnkylAf3QXSabjqIUyNRpHJ0mvhVunsiPt93B",
  "https://4grk8c4nb6.ufs.sh/f/hTMofYr9TDJniDPG0PJ5No8mvt0KDTzyUc1aCfAW9wgpJPdY",
  "https://4grk8c4nb6.ufs.sh/f/hTMofYr9TDJnAz0J7a6fR1xtBLXiaT3vUhVzF8K0oCGQl6E9",
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
          <div key={image.id} className="w-48">
            <Image
              src={image.url}
              alt={`Image ${image.id}`}
              width={192}
              height={192}
            />
          </div>
        ))}
      </div>
    </main>
  );
}
