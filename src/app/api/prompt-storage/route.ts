import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

// Use Redis for persistent storage of prompts
// This prevents data loss on server restarts or deployments
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL ?? "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN ?? "",
});

// Set expiry time to 30 minutes to give enough time for the upload process
const PROMPT_EXPIRY_SECONDS = 30 * 60; // 30 minutes

interface PromptData {
  prompt: string;
  customName?: string;
}

export async function POST(request: Request) {
  try {
    const user = await auth();
    if (!user.userId) {
      console.error("Unauthorized access attempt to POST prompt-storage API");
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { prompt, timestamp, customName } = (await request.json()) as {
      prompt: string;
      timestamp: string;
      customName?: string;
    };

    console.log("POST prompt-storage request:", {
      userId: user.userId,
      timestamp,
      promptLength: prompt?.length || 0,
      hasCustomName: !!customName,
      customName,
    });

    if (!prompt || !timestamp) {
      console.warn("Missing prompt or timestamp in POST request");
      return new NextResponse("Missing prompt or timestamp", { status: 400 });
    }

    // Use a key format that includes user ID to prevent conflicts between users
    const key = `prompt:${user.userId}:${timestamp}`;
    console.log("Storing prompt with key:", key);

    // Store prompt and custom name as an object
    const dataToStore: PromptData = {
      prompt,
      ...(customName && { customName }),
    };

    // Store in Redis with expiry
    await redis.set(key, JSON.stringify(dataToStore), {
      ex: PROMPT_EXPIRY_SECONDS,
    });
    console.log("Successfully stored prompt data in Redis");

    return NextResponse.json({
      success: true,
      message: "Prompt stored successfully",
    });
  } catch (error) {
    console.error("Error storing prompt:", error);
    return NextResponse.json(
      { success: false, error: "Failed to store prompt" },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const timestamp = url.searchParams.get("timestamp");
    const userId = url.searchParams.get("userId");

    console.log("GET prompt-storage request:", {
      url: request.url,
      timestamp,
      userId,
      requestHeaders: Object.fromEntries(request.headers),
    });

    // For server-to-server requests, userId must be provided
    if (!userId) {
      // If no userId provided, fall back to authenticated user
      const user = await auth();
      if (!user.userId) {
        console.error("No userId provided and no authenticated user");
        return new NextResponse("Unauthorized", { status: 401 });
      }
    }

    if (!timestamp) {
      console.warn("Missing timestamp parameter in prompt-storage request");
      return NextResponse.json(
        { success: false, error: "Missing timestamp" },
        { status: 400 },
      );
    }

    // Validate timestamp is actually a number
    const timestampNum = Number(timestamp);
    if (isNaN(timestampNum)) {
      console.warn(`Invalid timestamp format: '${timestamp}' is not a number`);
      return NextResponse.json(
        {
          success: false,
          error: "Invalid timestamp format, expected a number",
        },
        { status: 400 },
      );
    }

    // Use the same key format as in POST
    const key = `prompt:${userId}:${timestamp}`;
    console.log("Looking up prompt with key:", key);

    const storedData = await redis.get(key);
    console.log("Prompt retrieval result:", {
      found: !!storedData,
      dataType: typeof storedData,
    });

    if (!storedData) {
      console.warn(`Prompt not found for key: ${key}`);
      return NextResponse.json(
        {
          success: false,
          error: "Prompt not found or expired",
        },
        { status: 404 },
      );
    }

    // Parse the stored data
    try {
      const data = JSON.parse(storedData as string) as PromptData;
      console.log("Successfully parsed prompt data:", {
        hasCustomName: !!data.customName,
      });
      // Return just the prompt text and customName separately
      return NextResponse.json({
        success: true,
        prompt: data.prompt,
        customName: data.customName,
      });
    } catch (error) {
      // For backward compatibility - if the stored data is just a string (old format)
      console.log(
        "Stored data is in old format (string), using as prompt only",
      );
      return NextResponse.json({ success: true, prompt: storedData as string });
    }
  } catch (error) {
    console.error("Error retrieving prompt:", error);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve prompt" },
      { status: 500 },
    );
  }
}
