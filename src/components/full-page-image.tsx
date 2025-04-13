import { deleteImage, getImage } from "~/server/queries";
import Image from "next/image";
import { clerkClient } from "@clerk/nextjs/server";
import { Button } from "./ui/button";

export default async function FullPageImageView(props: { id: number }) {
  const idAsNumber = Number(props.id);
  if (Number.isNaN(idAsNumber)) throw new Error("Invalid photo id");

  const image = await getImage(props.id);
  console.log("Retrieved image data:", {
    id: image.id,
    name: image.name,
    hasPrompt: !!image.prompt,
    promptValue: image.prompt,
    hasModel: !!image.model,
    model: image.model,
  });

  // Debug filename parsing - check if our parsing logic would work on this name
  if (image.name.startsWith("generated-")) {
    const nameWithoutPrefix = image.name.substring(10); // 'generated-'.length = 10
    const nameWithoutExt = nameWithoutPrefix.replace(/\.png$/, "");
    const lastHyphenIndex = nameWithoutExt.lastIndexOf("-");

    if (lastHyphenIndex !== -1) {
      const parsedTimestamp = nameWithoutExt.substring(lastHyphenIndex + 1);
      const parsedModel = nameWithoutExt.substring(0, lastHyphenIndex);

      console.log("Debug filename parsing:", {
        original: image.name,
        parsedModel,
        parsedTimestamp,
        isValidTimestamp: !isNaN(Number(parsedTimestamp)),
        matchesStoredModel: parsedModel === image.model,
      });
    } else {
      console.log(
        "Debug filename parsing failed: No hyphen found after prefix",
      );
    }
  }

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
          <span>
            {new Date(image.createdAt).toLocaleString(undefined, {
              dateStyle: "medium",
              timeStyle: "medium",
            })}
          </span>
        </div>
        {image.model && (
          <div className="flex flex-col p-2">
            <span>Model:</span>
            <span>{image.model.split("/")[1] ?? image.model}</span>
          </div>
        )}
        {image.prompt && (
          <div className="flex flex-col p-2">
            <span>Prompt:</span>
            <span className="text-sm text-muted-foreground">
              {(() => {
                // Check if prompt is a JSON string
                try {
                  interface PromptData {
                    prompt: string;
                    customName?: string;
                  }

                  const promptData = JSON.parse(image.prompt) as PromptData;
                  // If it's our expected format with a prompt field, use that
                  if (
                    promptData &&
                    typeof promptData === "object" &&
                    typeof promptData.prompt === "string"
                  ) {
                    return promptData.prompt;
                  }
                  // Otherwise, just show the stringified JSON
                  return image.prompt;
                } catch (e) {
                  // If it's not JSON, just return the raw prompt
                  return image.prompt;
                }
              })()}
            </span>
          </div>
        )}
        <div className="flex flex-col p-2">
          <form
            action={async () => {
              "use server";
              await deleteImage(idAsNumber);
            }}
          >
            <Button type="submit" variant="destructive">
              Delete
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
