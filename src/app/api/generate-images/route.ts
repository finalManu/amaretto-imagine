import { NextRequest, NextResponse } from "next/server";
import { experimental_generateImage as generateImage } from "ai";
import { replicate } from "@ai-sdk/replicate";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { PROVIDERS } from "~/lib/provider-config";

// Using Stable Diffusion 3.5 Turbo as default model
const DEFAULT_MODEL = "stability-ai/stable-diffusion-3.5-large-turbo";
const DEFAULT_SIZE = "1024x1024";

// Create a Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL ?? "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN ?? "",
});

// Create a rate limiter that allows 10 requests per hour
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 h"),
  analytics: true,
});

// Define the expected request body type
interface RequestBody {
  prompt?: string;
  model?: string;
  [key: string]: unknown;
}

export async function POST(req: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);
  console.log(`Starting image generation request [requestId=${requestId}]`);

  try {
    // Get IP for rate limiting
    const ip = req.headers.get("x-forwarded-for") ?? "anonymous";

    // Check rate limit
    const { success, limit, reset, remaining } = await ratelimit.limit(ip);

    if (!success) {
      console.warn(`Rate limit exceeded [requestId=${requestId}, ip=${ip}]`);
      return NextResponse.json(
        {
          error: `Rate limit exceeded. Try again in ${Math.ceil(
            (reset - Date.now()) / 1000 / 60,
          )} minutes.`,
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": reset.toString(),
          },
        },
      );
    }

    // Parse request body
    let body: RequestBody;
    try {
      body = (await req.json()) as RequestBody;
      console.log(`Request body [requestId=${requestId}]:`, body);
    } catch (e) {
      console.error(`Error parsing request body [requestId=${requestId}]:`, e);
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 },
      );
    }

    // Validate prompt
    const { prompt, model } = body;
    if (!prompt || typeof prompt !== "string" || prompt.trim() === "") {
      console.error(`Invalid prompt [requestId=${requestId}]:`, prompt);
      return NextResponse.json(
        { error: "Prompt is required and must be a non-empty string" },
        { status: 400 },
      );
    }

    // Validate model if provided
    const selectedModel = model ?? DEFAULT_MODEL;
    const availableModels = PROVIDERS.replicate.models;
    if (!availableModels.includes(selectedModel)) {
      console.error(`Invalid model [requestId=${requestId}]:`, selectedModel);
      return NextResponse.json(
        { error: "Invalid model selection" },
        { status: 400 },
      );
    }

    console.log(`Validated prompt [requestId=${requestId}]: "${prompt}"`);
    console.log(`Using model [requestId=${requestId}]: "${selectedModel}"`);

    const startstamp = performance.now();
    console.log(`Processing prompt [requestId=${requestId}]: "${prompt}"`);

    const generatePromise = generateImage({
      model: replicate.image(selectedModel),
      prompt,
      size: DEFAULT_SIZE,
      seed: Math.floor(Math.random() * 1000000),
    }).then(({ image, warnings }) => {
      if (warnings?.length > 0) {
        console.warn(`Warnings [requestId=${requestId}]:`, warnings);
      }
      console.log(
        `Completed image request [requestId=${requestId}, elapsed=${(
          (performance.now() - startstamp) /
          1000
        ).toFixed(1)}s].`,
      );

      return {
        image: image.base64,
      };
    });

    const result = await generatePromise;
    return NextResponse.json(result, {
      headers: {
        "X-RateLimit-Limit": limit.toString(),
        "X-RateLimit-Remaining": remaining.toString(),
        "X-RateLimit-Reset": reset.toString(),
      },
    });
  } catch (error) {
    console.error(`Error generating image [requestId=${requestId}]:`, error);
    return NextResponse.json(
      {
        error: "Failed to generate image. Please try again later.",
      },
      { status: 500 },
    );
  }
}
