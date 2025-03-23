import { auth, clerkClient } from "@clerk/nextjs/server";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { db } from "~/server/db";
import { images } from "~/server/db/schema";
import { ratelimit } from "~/server/ratelimit";

const f = createUploadthing();

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  imageUploader: f({
    image: {
      /**
       * For full list of options and defaults, see the File Route API reference
       * @see https://docs.uploadthing.com/file-routes#route-config
       */
      maxFileSize: "4MB",
      maxFileCount: 10,
    },
  })
    .middleware(async ({ req }) => {
      //req has a lot of cool options (check nextjs docs or just console.log it)
      // This code runs on server before upload
      const user = await auth();

      // If throw, the user will not be able to upload
      if (!user.userId) {
        throw new Error("Unauthorized");
      }

      const fullUserData = (await clerkClient()).users.getUser(user.userId);

      if ((await fullUserData)?.privateMetadata?.["can-upload"] !== true) {
        throw new Error("User has no upload permissions");
      }

      const { success } = await ratelimit.limit(user.userId);

      // eslint-disable-next-line @typescript-eslint/only-throw-error
      if (!success) {
        throw new Error("Ratelimited");
      }

      return { userId: user.userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON SERVER after upload
      console.log("Upload complete for userId:", metadata.userId);

      // Extract model and timestamp from filename
      const filename = file.name;
      const isGenerated = filename.startsWith("generated-");

      let model: string | undefined;
      let timestamp: string | undefined;

      if (isGenerated) {
        // Remove 'generated-' prefix and '.png' suffix
        const nameWithoutPrefix = filename.substring(10); // 'generated-'.length = 10
        const nameWithoutExt = nameWithoutPrefix.replace(/\.png$/, "");

        // Find the last hyphen which should be before the timestamp
        const lastHyphenIndex = nameWithoutExt.lastIndexOf("-");

        if (lastHyphenIndex !== -1) {
          // Everything after the last hyphen should be the timestamp
          timestamp = nameWithoutExt.substring(lastHyphenIndex + 1);
          // Everything before the last hyphen should be the model
          model = nameWithoutExt.substring(0, lastHyphenIndex);

          console.log("Parsed filename parts:", {
            originalName: filename,
            model,
            timestamp,
            isNumber: !isNaN(Number(timestamp)),
          });
        }
      }

      // Try to get the prompt from our temporary API
      let prompt: string | undefined;
      console.log("File info:", {
        name: file.name,
        isGenerated,
        model,
        timestamp,
        isValidTimestamp: timestamp && !isNaN(Number(timestamp)),
      });

      if (isGenerated && timestamp && !isNaN(Number(timestamp))) {
        // Implement retry logic for more reliability
        const maxRetries = 3;
        let retryCount = 0;
        let success = false;

        while (retryCount < maxRetries && !success) {
          try {
            // Add a slight delay between retries
            if (retryCount > 0) {
              await new Promise((resolve) =>
                setTimeout(resolve, 1000 * retryCount),
              );
            }

            // Get the base URL from environment variables or use a default
            const baseUrl =
              process.env.NEXT_PUBLIC_APP_URL ??
              (process.env.VERCEL_URL
                ? `https://${process.env.VERCEL_URL}`
                : "http://localhost:3000");

            console.log("Making server-to-server API request:", {
              url: `${baseUrl}/api/prompt-storage?timestamp=${timestamp}&userId=${metadata.userId}`,
              timestamp,
              userId: metadata.userId,
            });

            const response = await fetch(
              `${baseUrl}/api/prompt-storage?timestamp=${timestamp}&userId=${metadata.userId}`,
              {
                headers: {
                  "Content-Type": "application/json",
                  // No need for auth cookies now that we've modified the prompt-storage API
                },
              },
            );

            if (response.ok) {
              type PromptResponse = {
                success: boolean;
                prompt?: string;
                error?: string;
              };

              const data = (await response.json()) as PromptResponse;
              if (data.success && data.prompt) {
                prompt = data.prompt;
                success = true;
                console.log("Successfully retrieved prompt for image");
              } else {
                console.warn(
                  "Prompt retrieval returned success=false:",
                  data.error,
                );
                retryCount++;
              }
            } else {
              console.warn(
                `Prompt retrieval failed with status ${response.status}`,
              );
              retryCount++;
            }
          } catch (error) {
            console.error(
              `Failed to retrieve prompt (attempt ${retryCount + 1}/${maxRetries}):`,
              error instanceof Error ? error.message : String(error),
            );
            retryCount++;
          }
        }

        if (!success) {
          console.error(
            `Failed to retrieve prompt after ${maxRetries} attempts`,
          );
        }
      }

      // Insert the image record with any prompt we were able to retrieve
      console.log("About to save image with data:", {
        name: file.name,
        promptAvailable: !!prompt,
        promptValue: prompt,
        model: isGenerated ? model : undefined,
      });

      await db.insert(images).values({
        name: file.name,
        url: file.url,
        userId: metadata.userId,
        model: isGenerated ? model : undefined,
        prompt,
      });

      // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
      return { uploadedBy: metadata.userId };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
