import { getImage } from "~/server/queries";
import Image from "next/image";
import { clerkClient } from "@clerk/nextjs/server";

export default async function FullPageImageView(props: { id: number }) {
  const image = await getImage(props.id);
  const uploaderInfo = await (await clerkClient()).users.getUser(image.userId);

  /*using next image here is catch 22 because it does a lot of preloading with fake elements
to try and take up the right amount of space, but we don't even know the size of the image
since it is uploaded by user. File PR if I see a way to fix this.
*/

  //Update found this PR https://github.com/t3dotgg/t3gallery/pull/2
  return (
    <div className="flex h-full w-full min-w-0">
      <div className="flex flex-shrink items-center justify-center">
        <img
          src={image.url}
          className="h-full w-full flex-shrink object-contain"
          alt={image.name}
        />
      </div>
      <div className="flex w-96 flex-shrink-0 flex-col border-l">
        <div className="border-b p-2 text-center text-lg">{image.name}</div>
        <div className="flex flex-col p-2">
          <span>Uploaded by:</span>
          <span>{uploaderInfo.fullName}</span>
        </div>
        <div className="flex flex-col p-2">
          <span>Created on:</span>
          <span>{new Date(image.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}
